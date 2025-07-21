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
    const ws = new WebSocket(`${protocol}//localhost:8000/ws/${roomId}?client_id=${clientId}`);
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

    setMessages((msgs) => [...msgs, "📝 Captions submitted!"]);
  };

  // === Vote Submission ===
  const castVote = (targetId) => {
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: "submit_vote",
      vote_for: targetId,
    }));

    setHasVoted(true);
    setMessages((msgs) => [...msgs, "🗳️ Vote cast!"]);
  };

  // === Advance to next meme ===
  const advanceMeme = () => {
    if (!wsRef.current) return;{
      wsRef.current.send(JSON.stringify({ type: "next_meme" }));
    }
  };

  return (
    <div>
    <div className={styles['background-image']} />
    <div className={styles['centered-cell']} />
    <NavigationBar />
    <div className={styles.roomContainer}>
      <h1 className={styles.roomHeader}>🖼️ Make It Meme!</h1>
      <p>DEBUG: isCreator={isCreator.toString()}, gameStarted={gameStarted.toString()}</p>
      <button onClick={() => setIsCreator((prev) => !prev)}>
  Toggle isCreator (Current: {isCreator.toString()})
</button>

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

      {gameStarted && memeStatus?.status === "voting" && (
        <div>
          <h2 className={styles.roomHeader}>🗳️ Vote for the best caption!</h2>
          {memeStatus.submissions.map((submission, index) => (
            <div key = {submission.user_id} className={styles.captionSubmission}>
            <h3>{submission.username}</h3>
            <MemeCanvas
              meme={submission.meme}
              captions={submission.captions}
              setCaptions={() => {}} // No editing during voting
            />
            <div className={styles.buttonWrapper}>
            <button className={styles.button} onClick={() => castVote(submission.user_id)}>Vote</button>
            </div>
            </div>
          ))}
          {hasVoted && <p>✅ Vote submitted</p>}
          <p>⏳ {remaining}s left</p>
        </div>
      )}

      {gameStarted && memeStatus?.status === "results" && (
        <div>
          <h2 className={styles.roomHeader}>🏆 Results</h2>
          {memeStatus.winners?.length ? (
            <p>
              🎉 Winner{memeStatus.winners.length > 1 ? "s" : ""}:{" "}
              {memeStatus.winners.join(", ")}
              
            </p>
          ) : (
            <p>No votes received</p>
          )}

          <h3 className={styles.roomHeader}>All Captions</h3>
          <ul>
            {Object.entries(memeStatus.captions).map(([playerId, caption]) => {
              const votes = Object.values(memeStatus.votes).filter(
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
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
    </div>
    </div>
  );
}

