import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./HomePage.module.css";
import NavigationBar from "../../src/navBar";

export default function WhoSaidItHome() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [clientId, setClientId] = useState(null);
  const [username, setUsername] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [mode, setMode] = useState("idle"); // 'idle', 'creating', 'joining'
  const [error, setError] = useState("");

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL !== undefined ? process.env.NEXT_PUBLIC_BACKEND_URL : "http://localhost:8000").replace(/\/$/, '');

  const fetchWithRetry = async (url, options, retries = 1) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        const contentType = res.headers?.get("content-type") || "";
        const payload = contentType.includes("application/json") ? await res.json() : await res.text();

        if (res.ok) {
          return { ok: true, data: payload };
        }

        const message = payload?.detail || payload?.error || (typeof payload === "string" ? payload : null);

        // Retry on transient server errors
        if (attempt < retries && [429, 500, 502, 503, 504].includes(res.status)) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }

        return { ok: false, error: message || `Request failed (${res.status})` };
      } catch (err) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        return { ok: false, error: "Failed to connect to server" };
      }
    }
  };

  // Initialize client ID
  useEffect(() => {
    if (typeof window === "undefined") return;

    let id = localStorage.getItem("client_id");
    if (!id) {
      if (window.crypto && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        // Fallback for older browsers
        id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (
            c ^
            (window.crypto && crypto.getRandomValues
              ? crypto.getRandomValues(new Uint8Array(1))[0]
              : Math.random() * 16
            ) & 15 >> c / 4
          ).toString(16)
        );
      }
      localStorage.setItem("client_id", id);
    }
    setClientId(id);
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
    const result = await fetchWithRetry(`${BACKEND_URL}/join_room_with_username/${room_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
      },
      credentials: "include",
      body: JSON.stringify({ username, client_id: clientId }),
    }, 1);

    if (!result?.ok) {
      setError(result?.error || "Failed to join room");
      return false;
    }

    setShowUsernameInput(false);
    setRoomId(room_id);
    try { localStorage.setItem("room_id", String(room_id)); } catch {}
    router.push(`/who_said_it/room?room_id=${room_id}`);
    return true;
  };

  const submitUsername = async () => {
    if (!username || !clientId) {
      setError("Please enter a username");
      return;
    }

    if (!roomId) {
      // Create a new room first
      const result = await fetchWithRetry(`${BACKEND_URL}/create_room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        credentials: "include",
        body: JSON.stringify({ client_id: clientId }),
      }, 1);

      if (!result?.ok || !result?.data?.room_id) {
        setError(result?.error || "Failed to create room");
        return;
      }

      const newRoomId = result.data.room_id;
      await registerUsername(newRoomId);
    } else {
      // Joining existing room
      await registerUsername(roomId);
    }
  };

  const handleBack = () => {
    setShowUsernameInput(false);
    setRoomId("");
    setJoinInput("");
    setMode("idle");
    setError("");
  };

  return (
    <>
      <NavigationBar />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>🤔 Who Said It?</h1>
          <p className={styles.subtitle}>
            Kanye West or Adolf Hitler? Can you tell the difference?
          </p>
        </div>

        {!showUsernameInput ? (
          <div className={styles.menu}>
            <button onClick={handleCreate} className={styles.createButton}>
              Create New Room
            </button>

            <div className={styles.divider}>OR</div>

            <div className={styles.joinSection}>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
              <button onClick={handleJoin} className={styles.joinButton}>
                Join Room
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}
          </div>
        ) : (
          <div className={styles.usernameForm}>
            <h2>Choose Your Username</h2>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && submitUsername()}
            />
            <div className={styles.buttonGroup}>
              <button onClick={submitUsername} className={styles.submitButton}>
                {mode === "creating" ? "Create Room" : "Join Room"}
              </button>
              <button onClick={handleBack} className={styles.backButton}>
                Back
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}

        <div className={styles.instructions}>
          <h3>How to Play:</h3>
          <ol>
            <li>Create or join a room with friends</li>
            <li>Read the quote displayed on screen</li>
            <li>Vote for who you think said it: Kanye West or Adolf Hitler</li>
            <li>See how many you can get right!</li>
          </ol>
          <p className={styles.warning}>
            ⚠️ This game contains real quotes from historical figures and is intended for educational/entertainment purposes
          </p>
        </div>
      </div>
    </>
  );
}
