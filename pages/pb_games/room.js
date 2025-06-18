import styles from "./RoomPage.module.css";
import NavigationBar from "../../src/navBar";
import { useEffect, useState } from "react";

function getClientId() {
  let id = localStorage.getItem("client_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("client_id", id);
  }
  return id;
}

export default function RoomPage() {
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  // New states for voting
  const [question, setQuestion] = useState("");
  const [players, setPlayers] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [votesCount, setVotesCount] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [votingFinished, setVotingFinished] = useState(false);
  const [winners, setWinners] = useState([]);

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, '');

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
        if (data.messages) {
          setMessages(data.messages);
          setRoomId(data.room_id);
          setIsCreator(data.is_creator);
        } else {
          setMessages(["You are not in a room or session expired."]);
        }
      });
  }, []);

  useEffect(() => {
    if (gameStarted && !votingFinished) {
      setHasVoted(false);
    }
  }, [question]);

  // Polling game status, including voting
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/game_status/${roomId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "waiting") {
            setGameStarted(false);
            setVotingFinished(false);
            setHasVoted(false);
            setMessages([`${roomId} Waiting for the game to start...`]);
          } else if (data.status === "voting") {
            setGameStarted(true);
            setVotingFinished(false);
            setQuestion(data.question);
            setPlayers(data.players);
            setRemaining(data.remaining);
            setVotesCount(data.votes_count);
            
            setMessages((msgs) => {
              if (!msgs.includes("Game has started!")) {
                return [...msgs, "Game has started!"];
              }
              return msgs;
            });
          } else if (data.status === "finished") {
            setVotingFinished(true);
            setWinners(data.winners);
            setVotesCount(data.votes_count);
          }
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId]);

  const startGame = () => {
    if (!roomId) return;
    fetch(`${BACKEND_URL}/start_game/${roomId}`, {
      method: "POST",
      headers: {
        "x-client-id": clientId,
      },
    });
  };

  const castVote = (player) => {
    if (hasVoted || votingFinished) return;

    fetch(`${BACKEND_URL}/vote/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voter_id: clientId, vote_for: player }),
    }).then(() => setHasVoted(true));
  };

  return (
    <div className={`${styles['centered-cell']} ${styles['background-image']}`}>
    <NavigationBar />
    <div className={styles.roomContainer}>
      <h1 className={styles.roomHeader}>Room</h1>

      <div className={styles.messageLog}>
        {messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((msg, i) => <p key={i}>{msg}</p>)
        )}
      </div>

      {!gameStarted && isCreator && (
        <div className={styles.buttonWrapper}>
          <button onClick={startGame} className={styles.button}>
            Start Game
          </button>
        </div>
      )}

      {gameStarted && !votingFinished && (
        <div className={styles.questionBox}>
          <h2>{question}</h2>
          <p>Time remaining: {remaining}s</p>

          <div className={styles.voteButtons}>
            {players.map((p) => (
              <button
                key={p}
                onClick={() => castVote(p)}
                disabled={hasVoted}
                className={styles.button}
              >
                {p} ({votesCount[p] || 0})
              </button>
            ))}
          </div>

          {hasVoted && <p>Thanks for voting!</p>}
        </div>
      )}

      {votingFinished && (
        <div className={styles.resultBox}>
          <h2>Voting finished!</h2>
          <p>Winner(s): {winners.join(", ")}</p>
          <ul className={styles.voteCount}>
            {Object.entries(votesCount).map(([player, count]) => (
              <li key={player}>
                {player}: {count} vote{count !== 1 ? "s" : ""}
              </li>
            ))}
          </ul>

          {isCreator && (
            <div className={styles.buttonWrapper}>
              <button
                onClick={() => {
                  fetch(`${BACKEND_URL}/next_question/${roomId}`, {
                    method: "POST",
                    headers: { "x-client-id": clientId },
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.status === "voting") {
                        setQuestion(data.question);
                        setPlayers(data.players);
                        setVotesCount({});
                        setRemaining(data.remaining);
                        setVotingFinished(false);
                        setHasVoted(false);
                      } else if (data.status === "game_over") {
                        setMessages((msgs) => [...msgs, "Game Over!"]);
                      }
                    });
                }}
                className={styles.button}
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}