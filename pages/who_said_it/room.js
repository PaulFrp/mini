import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import styles from "./RoomPage.module.css";
import NavigationBar from "../../src/navBar";
import {
  GAME_KEYS,
  getBackendUrl,
  getWsBaseUrl,
  getOrCreateClientId,
  resolveRoomId,
  persistRoomId,
  roomHeaders,
  fetchGameStatus,
  onPageVisible,
  HTTP_POLL_MS,
  WS_POLL_MS,
} from "../../src/roomClient";

const BACKEND_URL = getBackendUrl();
const WS_BASE_URL = getWsBaseUrl();
const GAME_KEY = GAME_KEYS.WHO_SAID_IT;
const QUOTE_OPTION_KEYS = ["option_a", "option_b", "option_c", "option_d"];

function getQuoteOptions(quote) {
  if (!quote) return [];
  return QUOTE_OPTION_KEYS.map((key) => quote[key]).filter((opt) => opt?.name);
}

export default function WhoSaidItRoom() {
  const router = useRouter();
  const wsRef = useRef(null);
  const currentGameStatusRef = useRef(null);
  const handleGameUpdateRef = useRef(null);
  const serverRemainingRef = useRef(null);
  const serverSyncedAtRef = useRef(0);
  
  const [clientId, setClientId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [playerMap, setPlayerMap] = useState({});
  
  // Game state
  const [currentQuote, setCurrentQuote] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(10);
  const [scores, setScores] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [votes, setVotes] = useState({});
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winners, setWinners] = useState([]);
  const [myVote, setMyVote] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setClientId(getOrCreateClientId());
    const queryRoomId = router.isReady ? router.query.room_id : null;
    const rid = resolveRoomId(GAME_KEY, queryRoomId);
    if (rid) {
      setRoomId(rid);
      persistRoomId(GAME_KEY, rid);
    }
  }, [router.isReady, router.query.room_id]);

  useEffect(() => {
    if (!clientId || !roomId) return;

    fetch(`${BACKEND_URL}/room_messages`, {
      credentials: "include",
      headers: roomHeaders(clientId, roomId),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setPlayerMap(data.player_map || {});
          setIsCreator(data.is_creator);
        }
      })
      .catch(err => console.error("Failed to fetch room messages:", err));
  }, [clientId, roomId]);

  // Poll for player list updates in waiting room
  useEffect(() => {
    if (!roomId || !clientId || gameStarted) return;

    const pollInterval = setInterval(() => {
      Promise.all([
        fetch(`${BACKEND_URL}/room_players/${roomId}`, {
          credentials: "include",
          headers: roomHeaders(clientId, roomId),
        }).then(res => res.json()),
        fetchGameStatus(`${BACKEND_URL}/who_said_it/game_status?room_id=${roomId}`, clientId, roomId)
      ])
      .then(([playersData, statusData]) => {
        if (playersData.player_map) {
          setPlayerMap(playersData.player_map);
        }
        if (statusData.status && statusData.status !== "no_game") {
          console.log("✅ Game started detected via polling!");
          handleGameUpdateRef.current?.(statusData);
        }
      })
      .catch(err => console.error("Failed to poll room data:", err));
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [roomId, clientId, gameStarted]);

  // WebSocket connection
  useEffect(() => {
    if (!roomId || !clientId) return;

    console.log("🔌 Initializing WebSocket for room", roomId);
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 12;
    let isUnmounting = false;
    let reconnectTimer = null;

    const httpPollStatus = () => {
      fetchGameStatus(`${BACKEND_URL}/who_said_it/game_status?room_id=${roomId}`, clientId, roomId)
        .then((data) => {
          if (data?.status && data.status !== "no_game") {
            handleGameUpdateRef.current?.(data);
          }
        })
        .catch(() => {});
    };

    const connectWebSocket = () => {
      if (isUnmounting) return;
      
      try {
        const ws = new WebSocket(`${WS_BASE_URL}/ws/who_said_it/${roomId}?client_id=${clientId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ Who Said It WebSocket connected");
          reconnectAttempts = 0;
          ws.send(JSON.stringify({ type: "get_status" }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📦 WebSocket message:", data);

            if (data.type === "ping") {
              ws.send(JSON.stringify({ type: "pong" }));
              return;
            }

            if (data.type === "player_joined") {
              setPlayerMap(data.player_map || {});
              return;
            }

            if (data.type === "game_update") {
              handleGameUpdateRef.current?.(data);
            } else if (data.type === "game_over") {
              setGameOver(true);
              setWinners(data.winners);
              setScores(data.final_scores);
            } else if (data.error) {
              console.error("Error from server:", data.error);
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("🔌 WebSocket closed");
          httpPollStatus();
          if (!isUnmounting && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimer = setTimeout(connectWebSocket, Math.min(2000 * reconnectAttempts, 8000));
          }
        };
      } catch (err) {
        console.error("Failed to connect WebSocket:", err);
      }
    };

    connectWebSocket();
    httpPollStatus();

    const httpPollInterval = setInterval(httpPollStatus, HTTP_POLL_MS);
    const wsPollInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "get_status" }));
        } catch {}
      }
    }, WS_POLL_MS);

    const lobbyPollInterval = setInterval(() => {
      if (gameStarted) return;
      fetch(`${BACKEND_URL}/room_players/${roomId}`, {
        credentials: "include",
        headers: roomHeaders(clientId, roomId),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.player_map) setPlayerMap(data.player_map);
        })
        .catch(() => {});
    }, HTTP_POLL_MS);

    const cleanupVisible = onPageVisible(() => {
      reconnectAttempts = 0;
      httpPollStatus();
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        connectWebSocket();
      }
    });

    return () => {
      console.log("🧹 Cleaning up WebSocket");
      isUnmounting = true;
      cleanupVisible();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(httpPollInterval);
      clearInterval(wsPollInterval);
      clearInterval(lobbyPollInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomId, clientId, gameStarted]);

  const WHO_SAID_IT_TIMED_PHASES = new Set(["voting"]);

  const syncRemainingFromServer = (data) => {
    if (!WHO_SAID_IT_TIMED_PHASES.has(data.status)) {
      serverRemainingRef.current = null;
      setRemaining(null);
      return;
    }
    if (data.remaining === undefined) return;

    serverRemainingRef.current = data.remaining;
    serverSyncedAtRef.current = Date.now();
    setRemaining(data.remaining);
  };

  const timerActiveKey =
    gameStatus === "voting" ? `voting:${currentRound}` : "";

  useEffect(() => {
    if (!timerActiveKey || serverRemainingRef.current === null) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - serverSyncedAtRef.current) / 1000);
      setRemaining(Math.max(0, serverRemainingRef.current - elapsed));
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerActiveKey]);

  // Handle game updates
  const handleGameUpdate = (data) => {
    console.log("Handling game update:", data);
    
    const incomingStatus = data.status;
    const prevStatus = currentGameStatusRef.current;
    const statusChanged = incomingStatus && incomingStatus !== prevStatus;

    setGameStatus(incomingStatus);
    currentGameStatusRef.current = incomingStatus;
    setGameStarted(incomingStatus !== "no_game");
    
    if (data.current_quote) setCurrentQuote(data.current_quote);
    if (data.scores) setScores(data.scores);
    if (data.current_round) setCurrentRound(data.current_round);
    if (data.total_rounds) setTotalRounds(data.total_rounds);
    syncRemainingFromServer(data);
    
    if (statusChanged) {
      console.log("Phase changed to:", data.status);
      if (data.status === "voting") {
        setHasVoted(false);
        setMyVote(null);
        setCorrectAnswer(null);
        setVotes({});
      } else if (data.status === "results") {
        setCorrectAnswer(data.correct_answer);
        setVotes(data.votes || {});
      }
    } else {
      if (data.status === "results") {
        if (data.correct_answer) setCorrectAnswer(data.correct_answer);
        if (data.votes) setVotes(data.votes);
      }
    }

    if (data.has_voted !== undefined) {
      if (statusChanged || data.has_voted === true) {
        setHasVoted(data.has_voted);
      }
    }
  };

  useEffect(() => {
    handleGameUpdateRef.current = handleGameUpdate;
  });

  const startGame = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/who_said_it/start_game/${roomId}`, {
        method: "POST",
        headers: {
          "x-client-id": clientId,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || "Failed to start game");
      } else {
        console.log("Game start request sent");
        
        let attempts = 0;
        const maxAttempts = 15;
        
        const pollStatus = async () => {
          if (attempts >= maxAttempts) return;
          attempts++;
          
          try {
            const statusRes = await fetch(`${BACKEND_URL}/who_said_it/game_status?room_id=${roomId}`, {
              headers: { "x-client-id": clientId },
              credentials: "include",
            });
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              
              if (statusData.status && statusData.status !== "no_game") {
                console.log("✅ Game started!");
                handleGameUpdateRef.current?.(statusData);
              } else if (attempts < maxAttempts) {
                setTimeout(pollStatus, 200);
              }
            }
          } catch (err) {
            console.error("Error polling:", err);
            if (attempts < maxAttempts) {
              setTimeout(pollStatus, 200);
            }
          }
        };
        
        pollStatus();
      }
    } catch (err) {
      console.error("Failed to start game:", err);
      alert("Failed to start game");
    }
  };

  const submitVote = (choice) => {
    if (!wsRef.current || hasVoted) return;

    console.log("Submitting vote:", choice);
    wsRef.current.send(JSON.stringify({
      type: "submit_vote",
      choice: choice,
    }));
    setHasVoted(true);
    setMyVote(choice);
  };

  const nextRound = async () => {
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: "next_round",
    }));
  };

  if (gameOver) {
    return (
      <>
        <NavigationBar />
        <div className={styles.container}>
          <div className={styles.gameOver}>
            <h1>🏆 Game Over!</h1>
            <h2>
              Winner{winners.length > 1 ? 's' : ''}: {winners.join(", ")}
            </h2>
            <div className={styles.finalScores}>
              <h3>Final Scores:</h3>
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([player, score]) => (
                  <div key={player} className={styles.scoreItem}>
                    {player}: {score}/{totalRounds}
                  </div>
                ))}
            </div>
            <button
              onClick={() => router.push("/who_said_it")}
              className={styles.backButton}
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🤔 Who Said It?</h1>
          <div className={styles.roomInfo}>
            Room ID: {roomId}
            {gameStarted && <span> | Round {currentRound}/{totalRounds}</span>}
            {remaining !== null && <span> | Time: {remaining}s</span>}
          </div>
        </div>

        {gameStarted && (
          <div className={styles.scoreBoard}>
            <h3>Scores</h3>
            <div className={styles.scores}>
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([player, score]) => (
                  <div key={player} className={styles.scoreItem}>
                    {player}: {score}
                  </div>
                ))}
            </div>
          </div>
        )}

        {!gameStarted && (
          <div className={styles.lobby}>
            <h2>Waiting Room</h2>
            <div className={styles.players}>
              <h3>Players ({Object.keys(playerMap).length}):</h3>
              <ul>
                {Object.values(playerMap).sort((a, b) => a.localeCompare(b)).map((username, idx) => (
                  <li key={idx}>{username}</li>
                ))}
              </ul>
            </div>
            {isCreator && (
              <button onClick={startGame} className={styles.startButton}>
                Start Game (Min 2 players)
              </button>
            )}
            <p className={styles.waitingText}>
              {isCreator
                ? "Click 'Start Game' when everyone is ready!"
                : "Waiting for host to start the game..."}
            </p>
          </div>
        )}

        {gameStarted && currentQuote && (
          <div className={styles.gameArea}>
            <div className={styles.quoteCard}>
              <div className={styles.quoteText}>
                "{currentQuote.quote}"
              </div>
            </div>

            {gameStatus === "voting" && !hasVoted && (
              <div className={styles.choices}>
                <h3>Who said it?</h3>
                <div className={styles.choiceButtons}>
                  {getQuoteOptions(currentQuote).map((option) => (
                    <button
                      key={option.name}
                      className={styles.choiceButton}
                      onClick={() => submitVote(option.name)}
                    >
                      <div className={styles.choiceName}>{option.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gameStatus === "voting" && hasVoted && (
              <div className={styles.waitingMessage}>
                ✓ Vote submitted! Waiting for other players...
              </div>
            )}

            {gameStatus === "results" && (
              <div className={styles.results}>
                <h2 className={styles.correctAnswer}>
                  {myVote === correctAnswer ? "✅ Correct!" : "❌ Wrong!"}
                </h2>
                <div className={styles.revealAnswer}>
                  <strong>Answer:</strong> {correctAnswer}
                </div>
                <div className={styles.voteBreakdown}>
                  <h3>Votes:</h3>
                  {Object.entries(votes).map(([choice, count]) => (
                    <div key={choice} className={styles.voteItem}>
                      {choice}: {count} vote{count !== 1 ? 's' : ''}
                    </div>
                  ))}
                </div>
                {isCreator && (
                  <button onClick={nextRound} className={styles.nextRoundButton}>
                    Next Round
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
