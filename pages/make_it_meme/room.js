import { useEffect, useState, useRef  } from "react";
import styles from "./RoomPage.module.css";
import NavigationBar from "../../src/navBar";
import MemeCanvas from "./memecanvas";

//Solve the problem when using crypto random UUID in browsers that do not support it
function getClientId() {
  let id = localStorage.getItem("client_id");
  if (!id) {
    if (window.crypto && crypto.randomUUID) {
      // Use modern API when available
      id = crypto.randomUUID();
    } else {
      // Fallback for older browsers
      id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (
          c ^
          (window.crypto && crypto.getRandomValues
            ? crypto.getRandomValues(new Uint8Array(1))[0]
            : Math.random() * 16
          ) & 15 >> c / 4
        ).toString(16)
      );
    }
    localStorage.setItem("client_id", id);
  }
  return id;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, '');
// Safe fallback for WebSocket base: derive from BACKEND_URL if NEXT_PUBLIC_WS_BASE_URL isn't set
const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_BASE_URL || BACKEND_URL
  .replace(/^http:\/\//, 'ws://')
  .replace(/^https:\/\//, 'wss://'))
  .replace(/\/$/, '');

export default function MemeGame() {
  const wsRef = useRef(null);
  const noGameCountRef = useRef(0); // Guard against transient 'no_game' after start
  const currentGameStatusRef = useRef(null); // Track game status to detect transient resets
  const [messages, setMessages] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [isSubmittingCaption, setIsSubmittingCaption] = useState(false);
  const [hasSubmittedCaptions, setHasSubmittedCaptions] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [memeStatus, setMemeStatus] = useState(null);
  const [playerMap, setPlayerMap] = useState({}); // Optional: to resolve player_id to username
  const [isCreator, setIsCreator] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [currentVoteIndex, setCurrentVoteIndex] = useState(0);
  const [hasFinishedVoting, setHasFinishedVoting] = useState(false);
  const lastStatusSeqRef = useRef(0); // avoid processing stale WS frames if they arrive out of order

  // === Polling ===
  // First effect: load client ID
  //Probably need to nuke the next two UseEffects Because shit don t work no more in prod apparently
useEffect(() => {
  if (typeof window === "undefined") return;

  let id = localStorage.getItem("client_id");
  if (!id) {
    if (window.crypto && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (
          c ^ (window.crypto && crypto.getRandomValues
            ? crypto.getRandomValues(new Uint8Array(1))[0]
            : Math.random() * 16
          ) & 15 >> c / 4
        ).toString(16)
      );
    }
    localStorage.setItem("client_id", id);
  }
  setClientId(id);
  // Try to restore room id from localStorage (Safari cross-site cookie fallback)
  try {
    const rid = localStorage.getItem("room_id");
    if (rid) setRoomId(rid);
  } catch {}
}, []);

// Second effect: fetch messages only when we have a clientId
useEffect(() => {
  if (!clientId) return; // wait until ready

  const headers = { "x-client-id": clientId };
  if (roomId) headers["x-room-id"] = roomId;

  fetch(`${BACKEND_URL}/room_messages`, {
    credentials: "include",
    headers,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("📦 /room_messages data:", data);
      if (data.messages) {
        setMessages(data.messages);
        setRoomId(data.room_id);
        try { localStorage.setItem("room_id", data.room_id); } catch {}
        setPlayerMap(data.player_map);
        setIsCreator(data.is_creator);
      } else {
        setMessages(["You are not in a room or session expired."]);
      }
    });
}, [clientId, roomId]);

// -------------- Nuke until here 


  useEffect(() => {
    if (!roomId || !clientId) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimer = null;

    const connectWebSocket = () => {
      try {
        console.log("WS Base URL:", WS_BASE_URL);
        // Use configured WS base or fallback derived from BACKEND_URL
        const ws = new WebSocket(`${WS_BASE_URL}/ws/${roomId}?client_id=${clientId}`);

        // For local dev use this:
        // const ws = new WebSocket(`http://localhost:8000/ws/${roomId}?client_id=${clientId}`);
        console.log("WebSocket connecting...", ws);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          reconnectAttempts = 0; // Reset attempts on successful connection
          ws.send(JSON.stringify({ type: "get_status" }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📦 WebSocket message received:", data);
            console.log("📦 Message type:", data.type, "Status:", data.status);
            
            // Respond to ping to keep connection alive on Heroku
            if (data.type === "ping") {
              ws.send(JSON.stringify({ type: "pong" }));
              console.log("🏓 Sent pong response");
              return;
            }

            // Drop out-of-order frames if backend includes a monotonically increasing sequence
            if (typeof data.seq === "number") {
              if (data.seq <= lastStatusSeqRef.current) {
                console.log("🔀 Dropping stale frame seq", data.seq);
                return;
              }
              lastStatusSeqRef.current = data.seq;
            }

            if (data.type === "caption_received") {
              setHasSubmittedCaptions(true);
              setIsSubmittingCaption(false);
              setMessages("📝 Captions received! Waiting for others...");
              return;
            }
            
            if (data.type === "game_update") {
              console.log("🎮 Processing game_update - status:", data.status);
              
              // Guard: ignore transient 'no_game' after game has started
              if (data.status === "no_game" && currentGameStatusRef.current && currentGameStatusRef.current !== "no_game") {
                noGameCountRef.current = (noGameCountRef.current || 0) + 1;
                console.log("⚠️ Transient 'no_game' (", noGameCountRef.current, ") after having status:", currentGameStatusRef.current);
                if (noGameCountRef.current <= 2) {
                  // Don't flip back to lobby immediately; request fresh status
                  try {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: "get_status" }));
                    }
                  } catch {}
                  return; // Skip applying 'no_game' transiently
                }
              } else {
                // Reset counter when we get a normal status
                noGameCountRef.current = 0;
              }
              
              currentGameStatusRef.current = data.status;
              setGameStarted(data.status !== "no_game");
              setMemeStatus(data);
              console.log("🎮 Updated gameStarted:", data.status !== "no_game");
              console.log("🎮 Current meme:", data.current_meme);
              
              if (typeof data.is_creator !== "undefined") {
                setIsCreator(data.is_creator);
              }
              if (typeof data.remaining === "number") {
                setRemaining(data.remaining);
                console.log("⏳ Timer set to:", data.remaining);
              }
            } else if (data.error) {
              console.error("❌ Server error:", data.error);
              setMessages(data.error);
            } else {
              console.warn("⚠️ Unknown message type:", data.type);
            }
          } catch (e) {
            console.error("❌ Failed to parse WebSocket message:", e);
            console.error("❌ Raw message:", event.data);
          }
        };

        ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          setMessages("Connection error. Attempting to reconnect...");
        };

        ws.onclose = () => {
          console.log("⚠️ WebSocket disconnected. Reconnect attempts:", reconnectAttempts);
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000); // exponential backoff, max 10s
            console.log(`Retrying connection in ${delay}ms...`);
            reconnectTimer = setTimeout(connectWebSocket, delay);
          } else {
            console.error("❌ Max reconnection attempts reached");
            setMessages("Connection lost. Please refresh the page.");
          }
        };
      } catch (e) {
        console.error("❌ WebSocket creation error:", e);
        setMessages("Failed to connect. Retrying...");
      }
    };

    connectWebSocket();

    // Poll game status periodically as fallback when WS broadcast is missed (common on Heroku)
    const statusPollInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // When WS is open, use it for polling
        wsRef.current.send(JSON.stringify({ type: "get_status" }));
      }
      // Only use HTTP polling if WS never connected (but don't mix with WS updates)
    }, 2000); // Poll every 2 seconds

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(statusPollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, clientId]);

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;

    const timerId = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [remaining]);

  useEffect(() => {
  if (remaining === 0) {
    // Refresh game status when timer hits zero
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "get_status" }));
    } else {
      // fallback: fetch directly if websocket not ready
      fetch(`${BACKEND_URL}/meme/game_status?room_id=${roomId}`, {
        headers: { "x-client-id": clientId },
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          // update your memeStatus and related states accordingly
          if (data.status) {
            setMemeStatus(data);
            setGameStarted(data.status !== "no_game");
            if (typeof data.remaining === "number") setRemaining(data.remaining);
            if (typeof data.is_creator !== "undefined") setIsCreator(data.is_creator);
          }
        })
        .catch(console.error);
    }
  }
}, [remaining, roomId, clientId]);

  useEffect(() => {
    if (memeStatus?.status === "captioning") {
      // Clear captions only if it's a new meme
      setCaptions([]); 
      setHasSubmittedCaptions(false);
      setIsSubmittingCaption(false);
      setHasVoted(false); // Optional: reset vote status too
    }
    if (memeStatus?.status === "voting") {
      setCurrentVoteIndex(0);
      setHasVoted(false);
      setHasFinishedVoting(false);
    }
  }, [memeStatus?.status, memeStatus?.current_meme?.filename]);
      

  // === Game Start ===
  const startGame = async () => {
  if (!roomId) return;

  const res = await fetch(`${BACKEND_URL}/meme/start_game/${roomId}`, {
    method: "POST",
    headers: { "x-client-id": clientId },
    credentials: "include", // ensure session cookie crosses origins (Heroku)
  });

  const data = await res.json();
  console.log("Game started:", data);

  // Immediately poll for status (fallback if WS broadcast is delayed on Heroku)
  const pollStatus = async () => {
    try {
      const statusRes = await fetch(`${BACKEND_URL}/meme/game_status?room_id=${roomId}`, {
        headers: { "x-client-id": clientId },
        credentials: "include",
      });
      const statusData = await statusRes.json();
      console.log("🔄 Polled game status:", statusData);
      
      if (statusData.status && statusData.status !== "no_game") {
        setMemeStatus(statusData);
        setGameStarted(true);
        if (typeof statusData.remaining === "number") setRemaining(statusData.remaining);
        if (typeof statusData.is_creator !== "undefined") setIsCreator(statusData.is_creator);
      }
    } catch (err) {
      console.error("❌ Poll status error:", err);
    }
  };

  // Poll immediately and after short delays
  pollStatus();
  setTimeout(pollStatus, 1000);
  setTimeout(pollStatus, 2000);

  // Also try WebSocket get_status if connected
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({ type: "get_status" }));
  }
};

  const submitCaptions = () => {
    const cleaned = captions.map((c) => (c || "").trim()).filter((c) => c.length > 0);
    if (!cleaned.length) {
      setMessages("Please add a caption before submitting.");
      return;
    }

    // Prevent submissions when the server isn't expecting captions
    if (memeStatus?.status !== "captioning") {
      setMessages("⏳ Not in captioning phase. Please wait for the next round.");
      return;
    }

    const ws = wsRef.current;
    setIsSubmittingCaption(true);

    const payload = {
      type: "submit_caption",
      caption: cleaned,
    };

    const sendOverWs = () => {
      try {
        ws.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.error("❌ WS send failed:", err);
        return false;
      }
    };

    if (ws && ws.readyState === WebSocket.OPEN && sendOverWs()) {
      setMessages("📝 Captions submitted!");
      setHasSubmittedCaptions(true);
      setIsSubmittingCaption(false);
      return;
    }

    // Fallback to HTTP if WS is not ready (Heroku may drop idle connections)
    fetch(`${BACKEND_URL}/meme/submit_caption/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
      },
      credentials: "include",
      body: JSON.stringify({ captions: cleaned }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMessages("📝 Captions submitted!");
        setHasSubmittedCaptions(true);
      })
      .catch((err) => {
        console.error("❌ Caption submit fallback failed:", err);
        setMessages("Failed to submit caption. Please retry.");
        setHasSubmittedCaptions(false);
      })
      .finally(() => setIsSubmittingCaption(false));
  };

  // === Vote Submission ===
  const castVote = (targetId, points) => {
    if (!wsRef.current || hasFinishedVoting) return;

    wsRef.current.send(JSON.stringify({
      type: "submit_vote",
      vote_for: targetId,
      points: points,  // send points with vote
    }));

    setHasVoted(true);
    setHasFinishedVoting(true);  // Prevent any further voting
    setMessages( `🗳️ Vote cast with ${points} points! Waiting for results...`);
  };

  // === Advance to next meme ===
  const advanceMeme = () => {
    if (!wsRef.current) return;{
      wsRef.current.send(JSON.stringify({ type: "next_meme" }));
    }
  };

  const currentSubmission = memeStatus?.submissions?.[currentVoteIndex];
  const isOwnMeme = currentSubmission?.user_id === clientId;
  return (
    <div>
    <div className={styles['background-image']} />
    <div className={styles['centered-cell']} />
    <NavigationBar />
    <div className={styles.roomContainer}>
      <h1 className={styles.roomHeader}>🖼️ Make It Meme!</h1>

      {!gameStarted && isCreator && (
        <div className={styles.buttonWrapper}>
        <button className={styles.button} onClick={startGame}>
          ▶️ Start Game
        </button>
        </div>
      )}

      {!gameStarted && !isCreator && <p>Waiting for host to start the game...</p>}

      {gameStarted && memeStatus?.status === "captioning" && (
        <div>
          <h2 className={styles.roomHeader}>📝 Add your captions!</h2>
          <div className={`${styles.timer} ${remaining <= 10 ? styles.critical : remaining <= 20 ? styles.warning : ''}`}>
            ⏳ {remaining}s remaining
          </div>
          <MemeCanvas
            meme={memeStatus.current_meme}
            captions={captions}
            setCaptions={setCaptions}
          />
          <div className={styles.buttonWrapper}>
          <button
            className={styles.button}
            onClick={submitCaptions}
            disabled={isSubmittingCaption || hasSubmittedCaptions}
          >
            {isSubmittingCaption ? "⏳ Sending..." : hasSubmittedCaptions ? "✅ Submitted" : "✅ Submit Captions"}
          </button>
          </div>
        </div>
      )}

    {gameStarted && memeStatus?.status === "voting" && memeStatus.submissions.length > 0 && (
      <div>
        <h2 className={styles.roomHeader}>🗳️ Vote for your favorite!</h2>
        <div className={`${styles.timer} ${remaining <= 10 ? styles.critical : remaining <= 20 ? styles.warning : ''}`}>
          ⏳ {remaining}s remaining
        </div>
        
        {hasFinishedVoting ? (
          <div className={styles.messages}>
            <p>✅ Vote submitted! Waiting for other players...</p>
          </div>
        ) : (
          <>
            {/* Show only the current meme to vote */}
            {memeStatus.submissions[currentVoteIndex] && (
              <div key={memeStatus.submissions[currentVoteIndex].user_id} className={styles.captionSubmission}>
                <h3>{memeStatus.submissions[currentVoteIndex].username}</h3>
                <MemeCanvas
                  meme={memeStatus.submissions[currentVoteIndex].meme}
                  captions={memeStatus.submissions[currentVoteIndex].captions}
                  setCaptions={() => {}} // No editing during voting
                />
                <div className={styles.buttonWrapper}>
                  {isOwnMeme ? (
                    <>
                      <p style={{ width: '100%', textAlign: 'center', margin: '0.5rem 0' }}>
                        👤 This is your own meme — you can't vote.
                      </p>
                      <button
                        className={styles.button}
                        onClick={() => {
                          setMessages("⏩ Skipped your own meme.");
                          if (currentVoteIndex + 1 < memeStatus.submissions.length) {
                            setCurrentVoteIndex(currentVoteIndex + 1);
                          } else {
                            setMessages("✅ No more memes to view! Waiting for results...");
                            setHasFinishedVoting(true);
                          }
                        }}
                      >
                        ⏭️ Skip to Next
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={styles.button}
                        onClick={() => castVote(currentSubmission.user_id, 100)}
                        disabled={hasVoted || hasFinishedVoting}
                      >
                        👍 Upvote (+100 pts)
                      </button>
                      <button
                        className={styles.button}
                        onClick={() => castVote(currentSubmission.user_id, -50)}
                        disabled={hasVoted || hasFinishedVoting}
                      >
                        👎 Downvote (-50 pts)
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )}

    {gameStarted && memeStatus?.status === "results" && (
      <div>
        <h2 className={styles.roomHeader}>🏆 Results</h2>

        {/* Display player points */}
        {memeStatus.player_points && (
          <div>
            <h3 className={styles.roomHeader}>💯 Scores</h3>
            <ul>
              {Object.entries(memeStatus.player_points).map(([playerId, points]) => {
                // Try to get username from submissions first (includes DB lookup), then fallback to playerMap
                const username = memeStatus.submissions?.[playerId]?.username || playerMap[playerId] || playerId;
                return (
                  <li key={playerId}>
                    {username}: {points} points
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Display winners */}
        {memeStatus.winners?.length ? (
          <div>
            <h3>🎉 Winner{memeStatus.winners.length > 1 ? "s" : ""}</h3>
            {memeStatus.winners.map((id) => {
              const submission = memeStatus.submissions?.[id];
              if (!submission) return null;

              const { meme, captions, username } = submission;
              // Use username from submission (which comes from DB), fallback to playerMap
              const authorName = username || playerMap[id] || id;

              return (
                <div key={id} className={styles.winnerMemeCard}>
                  <p>{authorName}</p>
                  <MemeCanvas
                    meme={meme}
                    captions={captions}
                    setCaptions={() => {}} // read-only in results
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p>No votes received</p>
        )}


        {/* Display all captions and vote counts */}
        <h3 className={styles.roomHeader}>📝 All Captions</h3>
        <ul>
          {Object.entries(memeStatus.captions).map(([playerId, caption]) => {
            const votes = Object.values(memeStatus.votes || {}).filter(
              (v) => v === playerId
            ).length;
            // Try to get username from submissions first (includes DB lookup), then fallback to playerMap
            const username = memeStatus.submissions?.[playerId]?.username || playerMap[playerId] || playerId;
            return (
              <li key={playerId}>
                {username}: {caption.join(" / ")} (
                {votes} vote{votes === 1 ? "" : "s"})
              </li>
            );
          })}
        </ul>

        {/* Advance to next meme */}
        {isCreator && memeStatus.can_proceed && (
          <div className={styles.buttonWrapper}>
            <button className={styles.button} onClick={advanceMeme}>
              ➡️ Next Meme
            </button>
          </div>
        )}
      </div>
    )}



      {/* Messages */}
      <div className={styles.messages}>
          <p>{messages}</p>
      </div>
    </div>
    </div>
  );
}

