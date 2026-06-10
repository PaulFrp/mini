import { useEffect, useState, useRef, useCallback } from "react";
import styles from "./RoomPage.module.css";
import NavigationBar from "../../src/navBar";
import MemeCanvas from "./memecanvas";
import {
  GAME_KEYS,
  getBackendUrl,
  getWsBaseUrl,
  getOrCreateClientId,
  resolveRoomId,
  persistRoomId,
  roomHeaders,
  fetchGameStatus,
  onPageVisible,
  HTTP_POLL_MS,
  shouldIgnoreMemeGameUpdate,
} from "../../src/roomClient";

const BACKEND_URL = getBackendUrl();
const WS_BASE_URL = getWsBaseUrl();
const GAME_KEY = GAME_KEYS.MAKE_IT_MEME;

/** Voting sends an array; results use an id-keyed object. */
function normalizeSubmissions(submissions) {
  if (!submissions) return [];
  if (Array.isArray(submissions)) {
    return submissions.map((s) => ({
      user_id: s.user_id,
      username: s.username,
      meme: s.meme,
      captions: Array.isArray(s.captions) ? s.captions : [],
    }));
  }
  return Object.entries(submissions).map(([user_id, sub]) => ({
    user_id,
    username: sub.username,
    meme: sub.meme,
    captions: Array.isArray(sub.captions) ? sub.captions : [],
  }));
}

function findSubmission(submissions, userId) {
  return normalizeSubmissions(submissions).find((s) => s.user_id === userId);
}

export default function MemeGame() {
  const wsRef = useRef(null);
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
  const timerRoundRef = useRef("");
  const serverRemainingRef = useRef(null);
  const serverSyncedAtRef = useRef(0);
  const votingSkipSentRef = useRef("");
  const lastPhaseRef = useRef(null);
  const memeStatusRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false); // Track WebSocket connection for Safari

  const MEME_TIMED_PHASES = new Set(["captioning", "voting"]);

  const getMemeFilename = (data) =>
    data.current_meme?.filename || data.submissions?.[0]?.meme?.filename || null;

  const getTimerRoundKey = (data) => {
    if (!MEME_TIMED_PHASES.has(data.status)) return "";
    const memeFile = getMemeFilename(data);
    return memeFile ? `${data.status}:${memeFile}` : data.status;
  };

  const syncRemainingFromServer = (data) => {
    if (!MEME_TIMED_PHASES.has(data.status)) {
      timerRoundRef.current = "";
      serverRemainingRef.current = null;
      setRemaining(null);
      return;
    }
    if (typeof data.remaining !== "number") return;

    timerRoundRef.current = getTimerRoundKey(data);
    serverRemainingRef.current = data.remaining;
    serverSyncedAtRef.current = Date.now();
    setRemaining(data.remaining);
  };

  // Poll for updated player list in waiting room (every 1 second)
  useEffect(() => {
    if (!roomId || !clientId || gameStarted) return;

    const pollInterval = setInterval(() => {
      fetch(`${BACKEND_URL}/room_players/${roomId}`, {
        credentials: "include",
        headers: roomHeaders(clientId, roomId),
      })
        .then(res => res.json())
        .then(data => {
          if (data.player_map) {
            setPlayerMap(data.player_map);
          }
        })
        .catch(err => console.error("Failed to poll players:", err));
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [roomId, clientId, gameStarted, BACKEND_URL]);

  const applyGameUpdate = useCallback((data, source = "ws") => {
    if (!data?.status || data.status === "no_game") return;

    const current = memeStatusRef.current;
    if (
      source === "ws" &&
      current &&
      shouldIgnoreMemeGameUpdate(data, current)
    ) {
      console.log("Ignoring stale WS update:", data.status, "current:", current.status);
      return;
    }

    const phase = data.status;
    const phaseChanged = phase !== lastPhaseRef.current;
    lastPhaseRef.current = phase;

    setGameStarted(true);
    setMemeStatus((prev) => {
      if (!prev || phaseChanged) {
        memeStatusRef.current = data;
        return data;
      }
      const merged = { ...prev, ...data };
      if (merged.status === "results") {
        if (!data.captions && prev.captions) merged.captions = prev.captions;
        if (!data.votes && prev.votes) merged.votes = prev.votes;
        if (!data.winners && prev.winners) merged.winners = prev.winners;
        if (
          Array.isArray(data.submissions) &&
          prev.submissions &&
          !Array.isArray(prev.submissions)
        ) {
          merged.submissions = prev.submissions;
        }
      }
      memeStatusRef.current = merged;
      return merged;
    });
    if (typeof data.is_creator !== "undefined") setIsCreator(data.is_creator);
    syncRemainingFromServer(data);

    if (phaseChanged && phase === "voting") {
      setCurrentVoteIndex(0);
      setHasVoted(false);
      setHasFinishedVoting(false);
      votingSkipSentRef.current = "";
    }
    if (phaseChanged && phase === "captioning") {
      setCaptions([]);
      setHasSubmittedCaptions(false);
      setIsSubmittingCaption(false);
      setHasVoted(false);
    }
    if (phaseChanged && phase === "results") {
      setHasFinishedVoting(true);
    }
  }, []);

  const pollGameStatusNow = useCallback(() => {
    if (!roomId || !clientId) return;
    fetchGameStatus(
      `${BACKEND_URL}/meme/game_status?room_id=${roomId}`,
      clientId,
      roomId
    )
      .then((data) => applyGameUpdate(data, "http"))
      .catch(() => {});
  }, [roomId, clientId, applyGameUpdate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setClientId(getOrCreateClientId());
    const rid = resolveRoomId(GAME_KEY);
    if (rid) {
      setRoomId(rid);
      persistRoomId(GAME_KEY, rid);
    }
  }, []);

  useEffect(() => {
    lastPhaseRef.current = null;
    memeStatusRef.current = null;
    lastStatusSeqRef.current = 0;
  }, [roomId]);

  useEffect(() => {
    if (!clientId || !roomId) return;

    fetch(`${BACKEND_URL}/room_messages`, {
      credentials: "include",
      headers: roomHeaders(clientId, roomId),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          if (data.room_id) {
            setRoomId(String(data.room_id));
            persistRoomId(GAME_KEY, data.room_id);
          }
          setPlayerMap(data.player_map);
          setIsCreator(data.is_creator);
        } else {
          setMessages(["You are not in a room or session expired."]);
        }
      })
      .catch(console.error);
  }, [clientId, roomId]);


  useEffect(() => {
    if (!roomId || !clientId) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 12;
    let reconnectTimer = null;
    let unmounted = false;

    const httpPollStatus = () => {
      fetchGameStatus(
        `${BACKEND_URL}/meme/game_status?room_id=${roomId}`,
        clientId,
        roomId
      )
        .then((data) => applyGameUpdate(data, "http"))
        .catch(() => {});
    };

    const connectWebSocket = () => {
      if (unmounted) return;
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
          setWsConnected(true);
          reconnectAttempts = 0;
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
              applyGameUpdate(data);
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
          setWsConnected(false);
          httpPollStatus();
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 8000);
            reconnectTimer = setTimeout(connectWebSocket, delay);
          }
        };
      } catch (e) {
        console.error("❌ WebSocket creation error:", e);
        setMessages("Failed to connect. Retrying...");
      }
    };

    connectWebSocket();
    httpPollStatus();
    const burstTimers = [250, 750].map((ms) => setTimeout(httpPollStatus, ms));

    const httpPollInterval = setInterval(httpPollStatus, HTTP_POLL_MS);

    const cleanupVisible = onPageVisible(() => {
      reconnectAttempts = 0;
      httpPollStatus();
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        connectWebSocket();
      }
    });

    return () => {
      unmounted = true;
      cleanupVisible();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      burstTimers.forEach(clearTimeout);
      clearInterval(httpPollInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [roomId, clientId, applyGameUpdate]);

  const timerActiveKey =
    memeStatus?.status === "captioning"
      ? `captioning:${memeStatus?.current_meme?.filename || ""}`
      : memeStatus?.status === "voting"
      ? `voting:${memeStatus?.submissions?.[0]?.meme?.filename || ""}`
      : "";

  // Smooth 1s display derived from last server sync (resets on each phase/meme change).
  useEffect(() => {
    if (!timerActiveKey || serverRemainingRef.current === null) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - serverSyncedAtRef.current) / 1000);
      setRemaining(Math.max(0, serverRemainingRef.current - elapsed));
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerActiveKey]);

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
      votingSkipSentRef.current = "";
    }
  }, [memeStatus?.status, memeStatus?.current_meme?.filename, memeStatus?.submissions?.[0]?.meme?.filename]);

  useEffect(() => {
    if (memeStatus?.status !== "voting" || !clientId) return;

    const submissions = memeStatus.submissions || [];
    const roundKey = submissions[0]?.meme?.filename || "empty";
    if (votingSkipSentRef.current === roundKey) return;

    const votable = submissions.filter((s) => s.user_id !== clientId);
    if (submissions.length > 0 && votable.length === 0) {
      votingSkipSentRef.current = roundKey;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "skip_vote" }));
      }
      setHasFinishedVoting(true);
      setMessages("No other memes to vote on — waiting for results...");
    }
  }, [memeStatus?.status, memeStatus?.submissions, clientId]);
      

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
        syncRemainingFromServer(statusData);
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
      pollGameStatusNow();
      setTimeout(pollGameStatusNow, 400);
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
        pollGameStatusNow();
        setTimeout(pollGameStatusNow, 400);
      })
      .catch((err) => {
        console.error("❌ Caption submit fallback failed:", err);
        setMessages("Failed to submit caption. Please retry.");
        setHasSubmittedCaptions(false);
      })
      .finally(() => setIsSubmittingCaption(false));
  };

  const skipVote = () => {
    if (!wsRef.current || hasFinishedVoting) return;
    wsRef.current.send(JSON.stringify({ type: "skip_vote" }));
    setHasFinishedVoting(true);
    setMessages("✅ Done — waiting for results...");
    pollGameStatusNow();
    setTimeout(pollGameStatusNow, 400);
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
    setHasFinishedVoting(true);
    setMessages(`🗳️ Vote cast with ${points} points! Waiting for results...`);
    pollGameStatusNow();
    setTimeout(pollGameStatusNow, 400);
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
      
      {/* Safari connection status indicator */}
      {!wsConnected && (
        <div style={{ 
          backgroundColor: '#ff9800', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          ⚠️ Reconnecting... Game will sync via HTTP polling
        </div>
      )}

      {!gameStarted && isCreator && (
        <div className={styles.buttonWrapper}>
        <button className={styles.button} onClick={startGame}>
          ▶️ Start Game
        </button>
        </div>
      )}

      {!gameStarted && (
        <div className={styles.lobby}>
          <h2>Waiting Room</h2>
          <div className={styles.players}>
            <h3>Players ({Object.keys(playerMap).length}):</h3>
            <ul>
              {Object.values(playerMap).map((username, idx) => (
                <li key={idx}>{username}</li>
              ))}
            </ul>
          </div>
          {isCreator && (
            <button onClick={startGame} className={styles.startButton}>
              Start Game (Min 1 player)
            </button>
          )}
          <p className={styles.waitingText}>
            {isCreator
              ? "Click 'Start Game' when everyone is ready!"
              : "Waiting for host to start the game..."}
          </p>
        </div>
      )}

      {gameStarted && memeStatus?.status === "captioning" && (
        <div>
          <h2 className={styles.roomHeader}>📝 Add your captions!</h2>
          {remaining !== null && (
          <div className={`${styles.timer} ${remaining <= 10 ? styles.critical : remaining <= 20 ? styles.warning : ''}`}>
            ⏳ {remaining}s remaining
          </div>
          )}
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

    {gameStarted && memeStatus?.status === "voting" && (
      <div>
        <h2 className={styles.roomHeader}>🗳️ Vote for your favorite!</h2>
        {remaining !== null && (
        <div className={`${styles.timer} ${remaining <= 10 ? styles.critical : remaining <= 20 ? styles.warning : ''}`}>
          ⏳ {remaining}s remaining
        </div>
        )}

        {memeStatus.missing_submissions?.length > 0 && (
          <p className={styles.waitingText}>
            ⏭️ {memeStatus.missing_submissions.map((id) => playerMap[id] || id).join(", ")}{" "}
            didn't submit in time.
          </p>
        )}

        {memeStatus.submissions.length === 0 ? (
          <p className={styles.waitingText}>No memes were submitted — moving to results...</p>
        ) : hasFinishedVoting ? (
          <div className={styles.messages}>
            <p>✅ Vote submitted! Waiting for other players to finish voting...</p>
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
                          setCurrentVoteIndex((idx) => {
                            const total = memeStatus.submissions.length;
                            if (idx + 1 < total) return idx + 1;
                            skipVote();
                            return idx;
                          });
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

    {gameStarted && memeStatus?.status === "results" && (() => {
      const allSubmissions = normalizeSubmissions(memeStatus.submissions);
      const winnerIds = new Set(memeStatus.winners || []);
      const otherSubmissions = allSubmissions.filter((s) => !winnerIds.has(s.user_id));
      return (
      <div>
        <h2 className={styles.roomHeader}>🏆 Results</h2>

        {/* Display player points */}
        {memeStatus.player_points && (
          <div>
            <h3 className={styles.roomHeader}>💯 Scores</h3>
            <ul>
              {Object.entries(memeStatus.player_points).map(([playerId, points]) => {
                const sub = findSubmission(memeStatus.submissions, playerId);
                const username = sub?.username || playerMap[playerId] || playerId;
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
              const submission = findSubmission(memeStatus.submissions, id);
              if (!submission?.meme) return null;

              const authorName = submission.username || playerMap[id] || id;

              return (
                <div key={id} className={styles.winnerMemeCard}>
                  <p>{authorName}</p>
                  <MemeCanvas
                    meme={submission.meme}
                    captions={submission.captions}
                    setCaptions={() => {}}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p>
            {allSubmissions.length === 0
              ? "No memes were submitted this round."
              : "No votes received"}
          </p>
        )}


        {/* Display non-winner submissions with vote counts */}
        <h3 className={styles.roomHeader}>📝 All Captions</h3>
        {otherSubmissions.length === 0 ? (
          <p className={styles.waitingText}>
            {allSubmissions.length === 0
              ? "No submissions this round."
              : "No other submissions this round."}
          </p>
        ) : (
          <ul>
            {otherSubmissions.map((submission) => {
              const { user_id: playerId, meme, captions: captionTexts, username } = submission;
              const votes = Object.values(memeStatus.votes || {}).filter(
                (v) => v === playerId
              ).length;
              const authorName = username || playerMap[playerId] || playerId;
              const textFallback = (memeStatus.captions?.[playerId] || [])
                .filter(Boolean)
                .join(" / ");

              return (
                <li key={playerId} className={styles.captionSubmission}>
                  <h3>
                    {authorName} ({votes} vote{votes === 1 ? "" : "s"})
                  </h3>
                  {meme ? (
                    <MemeCanvas
                      meme={meme}
                      captions={captionTexts}
                      setCaptions={() => {}}
                    />
                  ) : (
                    <p>{textFallback || "No caption"}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Advance to next meme */}
        {isCreator && (
          <div className={styles.buttonWrapper}>
            <button className={styles.button} onClick={advanceMeme}>
              ➡️ Next Round
            </button>
          </div>
        )}
        {!isCreator && (
          <p className={styles.waitingText}>Waiting for host to start next round...</p>
        )}
      </div>
      );
    })()}



      {/* Messages */}
      <div className={styles.messages}>
          <p>{messages}</p>
      </div>
    </div>
    </div>
  );
}

