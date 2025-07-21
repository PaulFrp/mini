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

  // New state to track mode: 'idle', 'creating', 'joining'
  const [mode, setMode] = useState("idle");

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, '');

  useEffect(() => {
    let id = localStorage.getItem("client_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("client_id", id);
    }
    setClientId(id);
  }, []);

  const handleCreate = () => {
    setShowUsernameInput(true);
    setRoomId(null);
    setMode("creating");
  };

  const handleJoin = () => {
    setRoomId(joinInput);
    setShowUsernameInput(true);
    setMode("joining");
  };

  const registerUsername = async (room_id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/join_room_with_username/${room_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        credentials: "include",
        body: JSON.stringify({ username, client_id: clientId }),
      });

      if (res.ok) {
        setShowUsernameInput(false);
        setRoomId(room_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitUsername = async () => {
    if (!username || !clientId) return;

    if (!roomId) {
      try {
        const res = await fetch(`${BACKEND_URL}/create_room`, {
          method: "POST",
          credentials: "include",
          headers: { "x-client-id": clientId },
        });
        if (!res.ok) throw new Error("Error creating room");

        const data = await res.json();
        await registerUsername(data.room_id);
      } catch (err) {
        console.error(err);
      }
    } else {
      await registerUsername(roomId);
    }
  };

  return (
    <div>
    <NavigationBar />
    <div className={styles.homeContainer}>

      <div className={styles.memeHero}>
        <h1 className={styles.title}>🎉 Make It Meme 🎉</h1>
        <p className={styles.subtitle}>Create, Caption & Laugh with Friends!</p>
      </div>

      {/* Show Create and Join only if mode is 'idle' */}
      {mode === "idle" && (
        <div className={styles.buttonsGroup}>
          <button className={styles.createBtn} onClick={handleCreate} disabled={!clientId}>
            🚀 Create New Room
          </button>

          <div className={styles.joinGroup}>
            <input
              className={styles.textInput}
              placeholder="Enter Room ID"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
            />
            <button className={styles.joinBtn} onClick={handleJoin} disabled={!clientId || !joinInput}>
              🔗 Join Room
            </button>
          </div>
        </div>
      )}

      {/* Show username input if requested */}
      {showUsernameInput && (
        <div className={styles.usernameGroup}>
          <input
            className={styles.textInput}
            placeholder="Choose your meme name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button className={styles.submitBtn} onClick={submitUsername} disabled={!username}>
            🎤 Let’s Go!
          </button>
        </div>
      )}

      {/* Show Enter Room link only after username submitted */}
      {roomId && !showUsernameInput && (
        <div className={styles.linkBox}>
          <Link href="make_it_meme/room" className={styles.roomLink}>
            Enter Room &rarr;
          </Link>
        </div>
      )}
    </div>
    </div>
  );
}
