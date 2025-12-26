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
  const [mode, setMode] = useState(null); // 'create' or 'join'

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL !== undefined ? process.env.NEXT_PUBLIC_BACKEND_URL : "http://localhost:8000").replace(/\/$/, '');
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
    setMode('create');
    setShowUsernameInput(true);
    setRoomId(null); // reset roomId for new room
  };

  // When user clicks "Join Room", set the roomId and show username input
  const handleJoin = () => {
    if (joinInput.trim()) {
      setMode('join');
      setRoomId(joinInput);
      setShowUsernameInput(true);
    }
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

  const handleReset = () => {
    setMode(null);
    setShowUsernameInput(false);
    setUsername("");
    setJoinInput("");
    setRoomId("");
  };

  return (
    <div className={styles.container}>
      <div className={styles['background-image']} />
      <NavigationBar />
      
      <div className={styles.gameContainer}>
        {!mode ? (
          <>
            <p className={styles.subtitle}>Create or join a room to play with friends</p>
            
            <div className={styles.cardsWrapper}>
              {/* Create Room Card */}
              <div className={styles.card}>
                <div className={styles.cardIcon}>➕</div>
                <h2 className={styles.cardTitle}>Create Room</h2>
                <p className={styles.cardDescription}>
                  Start a new game and invite your friends to join
                </p>
                <button
                  className={`${styles.cardButton} ${styles.createButton}`}
                  onClick={handleCreate}
                  disabled={!clientId}
                >
                  Create New Room
                </button>
              </div>

              {/* Join Room Card */}
              <div className={styles.card}>
                <div className={styles.cardIcon}>🔗</div>
                <h2 className={styles.cardTitle}>Join Room</h2>
                <p className={styles.cardDescription}>
                  Enter a room ID to join an existing game
                </p>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.roomInput}
                    type="text"
                    placeholder="Enter Room ID"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                  />
                  <button
                    className={`${styles.cardButton} ${styles.joinButton}`}
                    onClick={handleJoin}
                    disabled={!clientId || !joinInput}
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : showUsernameInput ? (
          <div className={styles.modalSection}>
            <h2 className={styles.modalTitle}>
              {mode === 'create' ? '🎮 Create New Room' : '🔗 Join Room'}
            </h2>
            <p className={styles.modalSubtitle}>
              {mode === 'create' ? 'Choose your username' : `Enter your username for Room #${roomId}`}
            </p>
            
            <div className={styles.usernameInput}>
              <input
                className={styles.inputField}
                type="text"
                placeholder="Your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitUsername()}
                autoFocus
              />
            </div>

            <div className={styles.modalButtonGroup}>
              <button
                className={`${styles.modalButton} ${styles.submitButton}`}
                onClick={submitUsername}
                disabled={!username}
              >
                {mode === 'create' ? 'Create & Enter Room' : 'Join Room'}
              </button>
              <button
                className={`${styles.modalButton} ${styles.cancelButton}`}
                onClick={handleReset}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : roomId && !showUsernameInput ? (
          <div className={styles.successSection}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.successTitle}>Room Ready!</h2>
            <p className={styles.successText}>
              Room ID: <span className={styles.roomIdDisplay}>#{roomId}</span>
            </p>
            <p className={styles.successDescription}>
              You're all set. Click below to enter the game
            </p>
            
            <Link href="/pb_games/room" className={styles.successLink}>
              <button className={styles.successButton}>
                Enter Game →
              </button>
            </Link>

            <button
              className={styles.newRoomButton}
              onClick={handleReset}
            >
              Create Another Room
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}