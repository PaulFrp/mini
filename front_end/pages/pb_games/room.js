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

  // Polling for game status every 3 seconds once roomId is known
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      fetch(`http://localhost:8000/room_status/${roomId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "game_started") {
            setGameStarted(true);
            setMessages((msgs) => {
              // Add message only if not already present
              if (!msgs.includes("Game has started!")) {
                return [...msgs, "Game has started!"];
              }
              return msgs;
            });
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId]);

  const startGame = () => {
    if (!roomId) return;
    fetch(`http://localhost:8000/start_game/${roomId}`, {
      method: "POST",
    });
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

      {isCreator && !gameStarted && (
        <button onClick={startGame} style={{ marginTop: "1rem" }}>
          Start Game
        </button>
      )}

      {gameStarted && <p>The game is now started!</p>}
    </div>
  );
}
