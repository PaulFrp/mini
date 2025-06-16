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

  useEffect(() => {
    const id = getClientId();
    setClientId(id);

    fetch("http://localhost:8000/room_messages", {
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

  // Polling game status, including voting
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      fetch(`http://localhost:8000/game_status/${roomId}`)
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
    fetch(`http://localhost:8000/start_game/${roomId}`, {
      method: "POST",
      headers: {
        "x-client-id": clientId,
      },
    });
  };

  const castVote = (player) => {
    if (hasVoted || votingFinished) return;

    fetch(`http://localhost:8000/vote/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voter_id: clientId, vote_for: player }),
    }).then(() => setHasVoted(true));
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Room</h1>

      <div>
        {messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((msg, i) => <p key={i}>{msg}</p>)
        )}
      </div>

      {!gameStarted && isCreator && (
        <button onClick={startGame} style={{ marginTop: "1rem" }}>
          Start Game
        </button>
      )}

      {gameStarted && !votingFinished && (
        <div>
          <h2>{question}</h2>
          <p>Time remaining: {remaining}s</p>
          {players.map((p) => (
            <button
              key={p}
              onClick={() => castVote(p)}
              disabled={hasVoted}
              style={{ margin: "0.5rem" }}
            >
              {p} ({votesCount[p] || 0})
            </button>
          ))}
          {hasVoted && <p>Thanks for voting!</p>}
        </div>
      )}

      {votingFinished && (
        <div>
          <h2>Voting finished!</h2>
          <p>Winner(s): {winners.join(", ")}</p>
          <ul>
            {Object.entries(votesCount).map(([player, count]) => (
              <li key={player}>
                {player}: {count} vote{count !== 1 ? "s" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
