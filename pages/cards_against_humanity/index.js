import { useState, useEffect } from "react";
import styles from "./HomePage.module.css";
import NavigationBar from "../../src/navBar";
import {
  GAME_KEYS,
  getBackendUrl,
  getOrCreateClientId,
  persistRoomId,
  navigateToRoom,
  roomHeaders,
} from "../../src/roomClient";

const GAME_KEY = GAME_KEYS.CAH;

export default function CardsAgainstHumanityHome() {
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [clientId, setClientId] = useState(null);
  const [username, setUsername] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [mode, setMode] = useState("idle"); // 'idle', 'creating', 'joining'
  const [error, setError] = useState("");

  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);

  const handleCreate = () => {
    setShowUsernameInput(true);
    setRoomId(null);
    setMode("creating");
    setError("");
  };

  const handleJoin = () => {
    if (!joinInput) {
      setError("Please enter a room ID");
      return;
    }
    setRoomId(joinInput);
    setShowUsernameInput(true);
    setMode("joining");
    setError("");
  };

  const registerUsername = async (room_id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/join_room_with_username/${room_id}`, {
        method: "POST",
        headers: roomHeaders(clientId, room_id, { "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ username, client_id: clientId }),
      });

      if (res.ok) {
        setShowUsernameInput(false);
        setRoomId(room_id);
        persistRoomId(GAME_KEY, room_id);
        navigateToRoom("/cards_against_humanity/room", room_id);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to join room");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server");
    }
  };

  const submitUsername = async () => {
    if (!username || !clientId) {
      setError("Please enter a username");
      return;
    }

    if (!roomId) {
      // Create a new room first
      try {
        const res = await fetch(`${BACKEND_URL}/create_room`, {
          method: "POST",
          headers: {
            "x-client-id": clientId,
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const newRoomId = data.room_id;
          persistRoomId(GAME_KEY, newRoomId);
          await registerUsername(newRoomId);
        } else {
          const data = await res.json();
          setError(data.error || data.detail || "Failed to create room");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to connect to server");
      }
    } else {
      // Join existing room
      await registerUsername(roomId);
    }
  };

  return (
    <>
      <NavigationBar />
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Cards Against Humanity</h1>
          <p className={styles.subtitle}>The party game for horrible people</p>

          {!showUsernameInput ? (
            <>
              <div className={styles.buttonGroup}>
                <button onClick={handleCreate} className={styles.createButton}>
                  Create New Room
                </button>
              </div>

              <div className={styles.divider}>
                <span>OR</span>
              </div>

              <div className={styles.joinSection}>
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  className={styles.input}
                />
                <button onClick={handleJoin} className={styles.joinButton}>
                  Join Room
                </button>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.info}>
                <h3>How to Play:</h3>
                <ul>
                  <li>Minimum 2 players required</li>
                  <li>Each round, one player is the Card Czar</li>
                  <li>Other players complete the sentence with their cards</li>
                  <li>Card Czar picks the funniest answer</li>
                  <li>First to 5 points wins!</li>
                </ul>
              </div>
            </>
          ) : (
            <div className={styles.usernameSection}>
              <h2>Enter Your Username</h2>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && submitUsername()}
                className={styles.input}
                autoFocus
              />
              <button onClick={submitUsername} className={styles.submitButton}>
                {mode === "creating" ? "Create Room" : "Join Room"}
              </button>
              <button
                onClick={() => {
                  setShowUsernameInput(false);
                  setMode("idle");
                  setError("");
                }}
                className={styles.backButton}
              >
                Back
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
