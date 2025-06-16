import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [clientId, setClientId] = useState(null);
  const [username, setUsername] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem("client_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("client_id", id);
    }
    setClientId(id);
  }, []);

  // When user clicks "Create Room", just show username input first
  const handleCreate = () => {
    setShowUsernameInput(true);
    setRoomId(null); // reset roomId for new room
  };

  // When user clicks "Join Room", set the roomId and show username input
  const handleJoin = () => {
    setRoomId(joinInput);
    setShowUsernameInput(true);
  };

  // Helper function to register username in a room
  const registerUsername = async (room_id) => {
    try {
      const res = await fetch(
        `http://localhost:8000/join_room_with_username/${room_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": clientId,
          },
          credentials: "include",
          body: JSON.stringify({
            username: username,
            client_id: clientId,
          }),
        }
      );

      if (res.ok) {
        console.log("User registered in room");
        setShowUsernameInput(false);
        setRoomId(room_id);
      } else {
        console.error("Failed to register user");
      }
    } catch (err) {
      console.error("Register error:", err);
    }
  };

  // When submitting username:
  // If no roomId yet => create room, then register username
  // If roomId exists => just register username (joining)
  const submitUsername = async () => {
    if (!username || !clientId) return;

    if (!roomId) {
      try {
        const res = await fetch("http://localhost:8000/create_room", {
          method: "POST",
          credentials: "include",
          headers: {
            "x-client-id": clientId,
          },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        console.log("Room created:", data);
        await registerUsername(data.room_id);
      } catch (err) {
        console.error("Error creating room:", err);
      }
    } else {
      await registerUsername(roomId);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Room System</h1>

      <button onClick={handleCreate} disabled={!clientId}>
        Create Room
      </button>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value)}
        />
        <button onClick={handleJoin} disabled={!clientId || !joinInput}>
          Join Room
        </button>
      </div>

      {showUsernameInput && (
        <div style={{ marginTop: "1rem" }}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={submitUsername} disabled={!username}>
            Submit Username
          </button>
        </div>
      )}

      {roomId && !showUsernameInput && (
        <div style={{ marginTop: "1rem" }}>
          <Link href="pb_games/room">Go to Room</Link>
        </div>
      )}
    </div>
  );
}
