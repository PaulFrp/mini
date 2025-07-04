import { useEffect, useState } from "react";
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
  const [messages, setMessages] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [memeStatus, setMemeStatus] = useState(null);
  const [playerMap, setPlayerMap] = useState({}); // Optional: to resolve player_id to username
  const [isCreator, setIsCreator] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [roomId, setRoomId] = useState(null);

  // === Polling ===
  useEffect(() => {
    const id = getClientId();
    setClientId(id);

    fetch(`${BACKEND_URL}/room_messages`, {
      credentials: "include",
      headers: {
        "x-client-id": id,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Room messages response:", data);
        if (data.messages) {
          setMessages(data.messages);
          setRoomId(data.room_id);
          setPlayerMap(data.player_map)
          setIsCreator(data.is_creator);
        } else {
          setMessages(["You are not in a room or session expired."]);
        }
      });

    console.log("isCreator:", isCreator, "gameStarted:", gameStarted);
    const interval = setInterval(() => {
      if (!roomId) return;

      fetch(`${BACKEND_URL}/meme/game_status/${roomId}`, {
        headers: { "x-client-id": clientId },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "no_game") {
            setGameStarted(false);
            setMemeStatus(null);
          } else {
            setGameStarted(true);
            setMemeStatus(data); 
          }
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId, clientId]);

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

  // === Caption Submission ===
  const submitCaptions = () => {
    if (!roomId || !captions.length) return;

    fetch(`${BACKEND_URL}/meme/submit_caption/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: clientId,
        captions: captions,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((msgs) => [...msgs, "📝 Captions submitted!"]);
      });
  };

  // === Vote Submission ===
  const castVote = (targetId) => {
    fetch(`${BACKEND_URL}/meme/vote/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voter_id: clientId,
        vote_for: targetId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setHasVoted(true);
        setMessages((msgs) => [...msgs, "🗳️ Vote cast!"]);
      });
  };

  // === Advance to next meme ===
  const advanceMeme = () => {
    fetch(`${BACKEND_URL}/meme/next_meme/${roomId}`, {
      method: "POST",
      headers: { "x-client-id": clientId },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "next_meme") {
          setCaptions([]);
          setHasVoted(false);
          setMessages((msgs) => [...msgs, "➡️ Next meme!"]);
        } else if (data.status === "game_over") {
          setMessages((msgs) => [...msgs, "🎉 Meme game over!"]);
        }
      });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🖼️ Make It Meme!</h1>

      {!gameStarted && isCreator && (
        <button className={styles.button} onClick={startGame}>
          ▶️ Start Game
        </button>
      )}

      {!gameStarted && !isCreator && <p>Waiting for host to start the game...</p>}

      {gameStarted && memeStatus?.status === "captioning" && (
        <div>
          <h2>📝 Add your captions!</h2>
          <MemeCanvas
            meme={memeStatus.current_meme}
            captions={captions}
            setCaptions={setCaptions}
          />
          <button className={styles.button} onClick={submitCaptions}>
            ✅ Submit
          </button>
          <p>⏳ {memeStatus.remaining}s left</p>
        </div>
      )}

      {gameStarted && memeStatus?.status === "voting" && (
        <div>
          <h2>🗳️ Vote for the best caption!</h2>
          <MemeCanvas
            meme={memeStatus.current_meme}
            captions={captions}
            setCaptions={setCaptions}
          />
          {Object.entries(memeStatus.captions).map(([playerId, caption], i) => (
            <button
              key={i}
              onClick={() => castVote(playerId)}
              disabled={hasVoted}
              className={styles.button}
            >
              {caption.join(" / ")}
            </button>
          ))}
          {hasVoted && <p>✅ Vote submitted</p>}
          <p>⏳ {memeStatus.remaining}s left</p>
        </div>
      )}

      {gameStarted && memeStatus?.status === "results" && (
        <div>
          <h2>🏆 Results</h2>
          {memeStatus.winners?.length ? (
            <p>
              🎉 Winner{memeStatus.winners.length > 1 ? "s" : ""}:{" "}
              {memeStatus.winners.join(", ")}
            </p>
          ) : (
            <p>No votes received</p>
          )}

          <h3>All Captions</h3>
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
            <button className={styles.button} onClick={advanceMeme}>
              ➡️ Next Meme
            </button>
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
  );
}

