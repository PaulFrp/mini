import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./HomePage.module.css";
import NavigationBar from "../../src/navBar";


export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [clientId, setClientId] = useState(null);
  const [username, setUsername] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, '');
  console.log("Using backend URL:", BACKEND_URL);

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
        `${BACKEND_URL}/join_room_with_username/${room_id}`,
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
        const res = await fetch(`${BACKEND_URL}/create_room`, {
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
    <div className={`${styles['centered-cell']} ${styles['background-image']}`}>
    <NavigationBar />
    <div className={styles.homeContainer}>
      <h1 className={styles.title}>Room System</h1>
  
      <div className={styles.buttonWrapper}>
        <button
          className={styles.button}
          onClick={handleCreate}
          disabled={!clientId}
        >
          Create Room
        </button>
      </div>
  
      <div className={styles.inputGroup}>
        <input
          className={styles.textInput}
          type="text"
          placeholder="Enter Room ID"
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value)}
        />
        
        <button
          className={styles.button}
          onClick={handleJoin}
          disabled={!clientId || !joinInput}
        >
          Join Room
        </button>
      </div>
  
      {showUsernameInput && (
        <div className={styles.buttonWrapper}>
        <div style={{ marginTop: "1.5rem" }}>
          <input
            className={styles.textInput}
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className={styles.button}
            onClick={submitUsername}
            disabled={!username}
          >
            Submit Username
          </button>
          </div>
        </div>
      )}
  
      {roomId && !showUsernameInput && (
        <div className={styles.buttonWrapper}>
        <div className={styles.linkBox}>
          <Link href="pb_games/room">Go to Room</Link>
        </div>
        </div>
      )}
    </div>
    </div>
  );
}