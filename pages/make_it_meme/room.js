import { useEffect, useState, useRef  } from "react";
import styles from "./RoomPage.module.css";
import NavigationBar from "../../src/navBar";
import MemeCanvas from "./memecanvas";

function getClientId() {
  let id = localStorage.getItem("client_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("client_id", id);
  }
  return id;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, '');

export default function MemeGame() {
  const wsRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [captions, setCaptions] = useState([]);
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

  // === Polling ===
  useEffect(() => {
    const id = getClientId();
    setClientId(id);

    fetch(`${BACKEND_URL}/room_messages`, {
      credentials: "include",
      headers: { "x-client-id": id },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 /room_messages data:", data);
        if (data.messages) {
          setMessages(data.messages);
          setRoomId(data.room_id);
          setPlayerMap(data.player_map);
          setIsCreator(data.is_creator);
        } else {
          setMessages(["You are not in a room or session expired."]);
        }
      }); 
  }, []);

  useEffect(() => {
    if (!roomId || !clientId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${BACKEND_URL}/ws/${roomId}?client_id=${clientId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "get_status" }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📦 data:", data);
      if (data.type === "game_update") {
        setGameStarted(data.status !== "no_game");
        setMemeStatus(data);
        if (typeof data.is_creator !== "undefined") {
          setIsCreator(data.is_creator);
        }
        if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
      }
      }
    };

        ws.onclose = () => console.log("WebSocket disconnected");

        return () => {
          ws.close();
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
  if (memeStatus?.status === "captioning") {
    // Clear captions only if it's a new meme
    setCaptions([]); 
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
    });

    const data = await res.json();
    console.log("Game started:", data);
  };

  const submitCaptions = () => {
    if (!captions.length || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: "submit_caption",
      caption: captions,
    }));

    setMessages( "📝 Captions submitted!");
  };

  // === Vote Submission ===
  const castVote = (targetId, points) => {
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: "submit_vote",
      vote_for: targetId,
      points: points,  // send points with vote
    }));

    setHasVoted(true);
    setMessages( `🗳️ Vote cast with ${points} points!`);

    // After voting, advance to next meme after a short delay
    setTimeout(() => {
      setHasVoted(false);
      if (currentVoteIndex + 1 < memeStatus.submissions.length) {
        setCurrentVoteIndex(currentVoteIndex + 1);
      } else {
        // All memes voted, maybe notify backend or show waiting screen
        setMessages("✅ All votes submitted! Waiting for results...");
        setHasFinishedVoting(true);
      }
    }, 1000); // 1 second delay to show confirmation before next
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
          <MemeCanvas
            meme={memeStatus.current_meme}
            captions={captions}
            setCaptions={setCaptions}
          />
          <div className={styles.buttonWrapper}>
          <button className={styles.button} onClick={submitCaptions}>
            ✅ Submit
          </button>
          </div>
          <p>⏳ {remaining}s left</p> 
        </div>
      )}

    {gameStarted && memeStatus?.status === "voting" && memeStatus.submissions.length > 0 && (
      <div>
        <h2 className={styles.roomHeader}>🗳️ Vote for the caption!</h2>
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
                  <p>👤 This is your own meme — you can't vote.</p>
                  <button
                    className={styles.button}
                    onClick={() => {
                      setMessages("⏩ Skipped your own meme.");
                      if (currentVoteIndex + 1 < memeStatus.submissions.length) {
                        setCurrentVoteIndex(currentVoteIndex + 1);
                      } else {
                        setMessages("✅ All votes submitted! Waiting for results...");
                        setHasFinishedVoting(true);
                      }
                    }}
                  >
                    ⏭️ Skip
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.button}
                    onClick={() => castVote(currentSubmission.user_id, 100)}
                    disabled={hasVoted || hasFinishedVoting}
                  >
                    👍 Upvote (+100)
                  </button>
                  <button
                    className={styles.button}
                    onClick={() => castVote(currentSubmission.user_id, -50)}
                    disabled={hasVoted || hasFinishedVoting}
                  >
                    👎 Downvote (-50)
                  </button>
                </>
              )}
            </div>

          </div>
        )}
        {hasVoted && <p>✅ Vote submitted</p>}
        <p>⏳ {remaining}s left</p>
      </div>
    )}

    {gameStarted && memeStatus?.status === "results" && (
      <div>
        <h2 className={styles.roomHeader}>🏆 Results</h2>

        {/* Display player points */}
        {memeStatus.player_points && (
          <div>
          {console.log("Player points:", memeStatus.player_points)}
            <h3 className={styles.roomHeader}>💯 Scores</h3>
            <ul>
              {Object.entries(memeStatus.player_points).map(([playerId, points]) => (
                <li key={playerId}>
                  {playerMap[playerId] || playerId}: {points} points
                </li>
              ))}
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

              const { meme, captions } = submission;
              const authorName = playerMap[id] || id;

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
            return (
              <li key={playerId}>
                {playerMap[playerId] || playerId}: {caption.join(" / ")} (
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

