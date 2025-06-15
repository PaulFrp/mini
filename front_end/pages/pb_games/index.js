import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [clientId, setClientId] = useState(null);

  // Initialize clientId only on client side
  useEffect(() => {
    let id = localStorage.getItem("client_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("client_id", id);
    }
    setClientId(id);
  }, []);

  const createRoom = async () => {
    if (!clientId) {
      console.warn("Client ID not ready yet");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/create_room", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-client-id": clientId,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Room created:", data);
      setRoomId(data.room_id);
    } catch (err) {
      console.error("Error in createRoom:", err);
    }
  };

  const joinRoom = async () => {
    if (!clientId) {
      console.warn("Client ID not ready yet");
      return;
    }
    await fetch(`http://localhost:8000/join_room/${joinInput}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "x-client-id": clientId,
      },
    });
    setRoomId(joinInput);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Room System</h1>

      <button onClick={createRoom} disabled={!clientId}>
        Create Room
      </button>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value)}
        />
        <button onClick={joinRoom} disabled={!clientId}>
          Join Room
        </button>
      </div>

      {roomId && (
        <div style={{ marginTop: "1rem" }}>
          <Link href="pb_games/room">Go to Room</Link>
        </div>
      )}
    </div>
  );
}
