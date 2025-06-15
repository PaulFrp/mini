import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");

  const createRoom = async () => {
    const res = await fetch("http://localhost:8000/create_room", {
      method: "POST",
      credentials: "include", // important for sending/receiving cookies
    });
    const data = await res.json();
    setRoomId(data.room_id);
  };

  const joinRoom = async () => {
    await fetch(`http://localhost:8000/join_room/${joinInput}`, {
      method: "POST",
      credentials: "include",
    });
    setRoomId(joinInput);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Room System</h1>

      <button onClick={createRoom}>Create Room</button>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>

      {roomId && (
        <div style={{ marginTop: "1rem" }}>
          <Link href="/room">Go to Room</Link>
        </div>
      )}
    </div>
  );
}
