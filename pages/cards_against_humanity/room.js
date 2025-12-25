import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import styles from "./RoomPage.module.css";
import NavigationBar from "../../src/navBar";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, '');
const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_BASE_URL || BACKEND_URL
  .replace(/^http:\/\//, 'ws://')
  .replace(/^https:\/\//, 'wss://'))
  .replace(/\/$/, '');

function getClientId() {
  if (typeof window === "undefined") return null;
  
  let id = localStorage.getItem("client_id");
  if (!id) {
    if (window.crypto && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ (window.crypto && crypto.getRandomValues
          ? crypto.getRandomValues(new Uint8Array(1))[0]
          : Math.random() * 16
        ) & 15 >> c / 4).toString(16)
      );
    }
    localStorage.setItem("client_id", id);
  }
  return id;
}

export default function CardsAgainstHumanityRoom() {
  const router = useRouter();
  const wsRef = useRef(null);
  const currentGameStatusRef = useRef(null); // Track current status to avoid stale closures
  
  const [clientId, setClientId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [playerMap, setPlayerMap] = useState({});
  const [messages, setMessages] = useState([]);
  
  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [scores, setScores] = useState({});
  const [round, setRound] = useState(1);
  const [cardCzar, setCardCzar] = useState(null);
  const [isCzar, setIsCzar] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [roundWinner, setRoundWinner] = useState(null);
  const [voteCounts, setVoteCounts] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [winners, setWinners] = useState([]);

  // Initialize client ID and room ID
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const id = getClientId();
    setClientId(id);
    
    const rid = router.query.room_id || localStorage.getItem("room_id");
    if (rid) {
      setRoomId(rid);
      localStorage.setItem("room_id", rid);
    }
  }, [router.query.room_id]);

  // Fetch initial room messages - only run once on mount
  useEffect(() => {
    if (!clientId || !roomId) return;

    const headers = { "x-client-id": clientId, "x-room-id": roomId };
    
    fetch(`${BACKEND_URL}/room_messages`, {
      credentials: "include",
      headers,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          setPlayerMap(data.player_map);
          setIsCreator(data.is_creator);
        }
      })
      .catch(err => console.error("Failed to fetch room messages:", err));
  }, [clientId, roomId]);

  // WebSocket connection - stable, only reconnects on mount or when roomId/clientId actually changes
  useEffect(() => {
    if (!roomId || !clientId) return;

    console.log("🔌 Initializing WebSocket for room", roomId, "client", clientId);
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let isUnmounting = false;

    const connectWebSocket = () => {
      if (isUnmounting) return;
      
      try {
        const ws = new WebSocket(`${WS_BASE_URL}/ws/cah/${roomId}?client_id=${clientId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ CAH WebSocket connected");
          reconnectAttempts = 0;
          ws.send(JSON.stringify({ type: "get_status" }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📦 CAH WebSocket message:", data);

            // Handle ping/pong
            if (data.type === "ping") {
              ws.send(JSON.stringify({ type: "pong" }));
              return;
            }

            if (data.type === "game_update") {
              handleGameUpdate(data);
            } else if (data.type === "player_submitted") {
              console.log(`Player submitted: ${data.player}`);
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
          if (!isUnmounting && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(connectWebSocket, 2000);
          }
        };
      } catch (err) {
        console.error("Failed to connect WebSocket:", err);
      }
    };

    connectWebSocket();

    // Poll for status updates every 2 seconds (ensures non-creator clients see game start)
    const pollInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "get_status" }));
      }
    }, 2000);

    return () => {
      console.log("🧹 Cleaning up WebSocket");
      isUnmounting = true;
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomId, clientId]);

  // Timer countdown effect
  useEffect(() => {
    if (remaining === null || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining !== null && remaining > 0]);

  const handleGameUpdate = (data) => {
    console.log("Handling game update:", data);
    console.log("Current state before update:", { isCzar, hasVoted, gameStatus, hasSubmitted, selectedCardsCount: selectedCards.length });
    
    const statusChanged = data.status && data.status !== currentGameStatusRef.current;
    
    setGameStatus(data.status);
    currentGameStatusRef.current = data.status; // Update ref immediately
    setGameStarted(data.status !== "no_game");
    
    if (data.current_question) setCurrentQuestion(data.current_question);
    // Only update player hand on phase transitions or at game start
    if (data.player_hand && (statusChanged || gameStatus === null)) {
      setPlayerHand(data.player_hand);
    }
    if (data.scores) setScores(data.scores);
    if (data.round) setRound(data.round);
    if (data.card_czar) setCardCzar(data.card_czar);
    if (data.is_czar !== undefined) {
      console.log("Setting isCzar to:", data.is_czar);
      setIsCzar(data.is_czar);
    }
    if (data.has_submitted !== undefined) {
      console.log("Setting hasSubmitted to:", data.has_submitted);
      // Only update hasSubmitted if we're not in the middle of the same playing phase
      // or if the server confirms submission (true), never reset to false during playing
      if (statusChanged || data.has_submitted === true) {
        setHasSubmitted(data.has_submitted);
      }
    }
    if (data.has_voted !== undefined) {
      console.log("Setting hasVoted to:", data.has_voted);
      // Only update hasVoted if phase changed or server confirms vote
      if (statusChanged || data.has_voted === true) {
        setHasVoted(data.has_voted);
      }
    }
    if (data.remaining !== undefined) setRemaining(data.remaining);
    
    // ONLY clear selections when transitioning between phases
    if (statusChanged) {
      console.log("Phase changed from", gameStatus, "to", data.status);
      if (data.status === "voting") {
        console.log("Transitioned to voting phase - clearing selections");
        setSubmissions(data.submissions || []);
        setSelectedCards([]); // Clear selected cards when moving to voting
      } else if (data.status === "results") {
        console.log("Transitioned to results phase");
        setSubmissions(data.submissions || []);
        setRoundWinner(data.round_winner);
        setVoteCounts(data.vote_counts || {});
      } else if (data.status === "playing") {
        console.log("Transitioned to playing phase - new round");
        setSubmissions([]);
        setRoundWinner(null);
        setVoteCounts({});
        setHasSubmitted(false); // Reset at start of NEW round
        setHasVoted(false);
        setSelectedCards([]); // Clear selections for new round
      }
    } else {
      // During same phase, only update specific data, don't touch selectedCards
      if (data.status === "voting" && data.submissions) {
        setSubmissions(data.submissions);
        // Do NOT clear selectedCards or hasSubmitted here
      } else if (data.status === "results" && data.submissions) {
        setSubmissions(data.submissions);
        if (data.round_winner) setRoundWinner(data.round_winner);
        if (data.vote_counts) setVoteCounts(data.vote_counts);
      }
      // For "playing" phase, don't touch selectedCards at all during polling
    }
    
    console.log("State after update:", { 
      statusChanged,
      newGameStatus: data.status,
      isCzar: data.is_czar, 
      hasVoted: data.has_voted, 
      hasSubmitted: data.has_submitted,
      selectedCardsCount: selectedCards.length
    });
  };

  const startGame = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/cah/start_game/${roomId}`, {
        method: "POST",
        headers: {
          "x-client-id": clientId,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || "Failed to start game");
      }
    } catch (err) {
      console.error("Failed to start game:", err);
      alert("Failed to start game");
    }
  };

  const toggleCardSelection = (card) => {
    if (hasSubmitted || isCzar) {
      console.log("Cannot select card:", { hasSubmitted, isCzar });
      return;
    }
    
    const requiredCards = currentQuestion?.blanks || 1;
    
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter(c => c !== card));
    } else {
      if (selectedCards.length < requiredCards) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  const submitCards = () => {
    if (!wsRef.current || selectedCards.length === 0 || hasSubmitted) {
      console.log("Cannot submit:", { hasWs: !!wsRef.current, selectedLength: selectedCards.length, hasSubmitted });
      return;
    }
    
    const requiredCards = currentQuestion?.blanks || 1;
    if (selectedCards.length !== requiredCards) {
      alert(`Please select exactly ${requiredCards} card(s)`);
      return;
    }

    console.log("Submitting cards:", selectedCards);
    wsRef.current.send(JSON.stringify({
      type: "submit_cards",
      cards: selectedCards,
    }));
    setHasSubmitted(true);
    // Do NOT clear selectedCards here - keep them visible until phase changes
  };

  const voteForSubmission = (playerName) => {
    if (!wsRef.current || !isCzar || hasVoted) {
      console.log("Cannot vote:", { hasWs: !!wsRef.current, isCzar, hasVoted });
      return;
    }

    console.log("Voting for:", playerName);
    wsRef.current.send(JSON.stringify({
      type: "submit_vote",
      voted_for: playerName,
    }));
    setHasVoted(true);
  };

  const nextRound = () => {
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: "next_round",
    }));
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    const parts = currentQuestion.text.split("_____");
    return (
      <div className={styles.questionCard}>
        <div className={styles.questionText}>
          {parts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < parts.length - 1 && <span className={styles.blank}>_____</span>}
            </span>
          ))}
        </div>
        <div className={styles.questionInfo}>
          Pick {currentQuestion.blanks} card{currentQuestion.blanks > 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  const renderQuestionWithAnswers = (cards) => {
    if (!currentQuestion) return null;
    
    // Check if question has blanks
    if (currentQuestion.text.includes("_____")) {
      const parts = currentQuestion.text.split("_____");
      return (
        <div className={styles.filledQuestion}>
          {parts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < parts.length - 1 && idx < cards.length && (
                <span className={styles.filledBlank}>{cards[idx]}</span>
              )}
            </span>
          ))}
        </div>
      );
    } else {
      // For questions without blanks, append the answer after
      return (
        <div className={styles.filledQuestion}>
          {currentQuestion.text}
          <br />
          <span className={styles.filledBlank}>{cards[0]}</span>
        </div>
      );
    }
  };

  const renderHand = () => {
    if (!playerHand || playerHand.length === 0) return null;
    
    return (
      <div className={styles.handContainer}>
        <h3>Your Cards:</h3>
        {hasSubmitted && (
          <p style={{textAlign: 'center', color: '#4CAF50', fontWeight: 'bold', marginBottom: '15px', fontSize: '1.1rem'}}>
            ✓ Thank you for your submission! Waiting for other players...
          </p>
        )}
        <div className={styles.hand}>
          {playerHand.map((card, idx) => (
            <div
              key={idx}
              className={`${styles.whiteCard} ${
                selectedCards.includes(card) ? styles.selected : ''
              } ${hasSubmitted || isCzar ? styles.disabled : ''}`}
              onClick={() => !hasSubmitted && !isCzar && toggleCardSelection(card)}
            >
              {card}
            </div>
          ))}
        </div>
        {!isCzar && (
          <>
            {hasSubmitted ? (
              <div style={{
                display: 'block',
                margin: '20px auto 0',
                padding: '15px 40px',
                background: '#4CAF50',
                color: 'white',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textAlign: 'center',
                cursor: 'default'
              }}>
                ✓ Submitted
              </div>
            ) : selectedCards.length > 0 ? (
              <button onClick={submitCards} className={styles.submitButton}>
                Submit {selectedCards.length} Card{selectedCards.length > 1 ? 's' : ''}
              </button>
            ) : null}
          </>
        )}
      </div>
    );
  };

  const renderSubmissions = () => {
    if (!submissions || submissions.length === 0) return null;
    
    console.log("Rendering submissions:", { submissions, isCzar, gameStatus, hasVoted });
    
    return (
      <div className={styles.submissionsContainer}>
        <h3>{gameStatus === "voting" ? "Vote for the Best!" : "Results"}</h3>
        {isCzar && gameStatus === "voting" && !hasVoted && (
          <p style={{textAlign: 'center', color: '#666', marginBottom: '15px'}}>
            Click on a submission to vote!
          </p>
        )}
        <div className={styles.submissions}>
          {submissions.map((sub, idx) => (
            <div
              key={idx}
              className={`${styles.submission} ${
                isCzar && gameStatus === "voting" && !hasVoted ? styles.clickable : ''
              } ${roundWinner === sub.player ? styles.winner : ''}`}
              onClick={() => {
                console.log("Submission clicked:", { sub, isCzar, gameStatus, hasVoted });
                if (isCzar && gameStatus === "voting" && !hasVoted) {
                  voteForSubmission(sub.player);
                }
              }}
            >
              {(gameStatus === "voting" || gameStatus === "results") && currentQuestion && (
                <div className={styles.submissionQuestion}>
                  {renderQuestionWithAnswers(sub.cards)}
                </div>
              )}
              {gameStatus === "results" && (
                <div className={styles.voteCount}>
                  {sub.votes} vote{sub.votes !== 1 ? 's' : ''}
                  {roundWinner === sub.player && " 👑"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (gameOver) {
    return (
      <>
        <NavigationBar />
        <div className={styles.container}>
          <div className={styles.gameOver}>
            <h1>Game Over!</h1>
            <h2>
              Winner{winners.length > 1 ? 's' : ''}: {winners.join(", ")}
            </h2>
            <div className={styles.finalScores}>
              <h3>Final Scores:</h3>
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([player, score]) => (
                  <div key={player} className={styles.scoreItem}>
                    {player}: {score} point{score !== 1 ? 's' : ''}
                  </div>
                ))}
            </div>
            <button
              onClick={() => router.push("/cards_against_humanity")}
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
          <h1>Cards Against Humanity</h1>
          <div className={styles.roomInfo}>
            Room ID: {roomId}
            {remaining !== null && <span> | Time: {remaining}s</span>}
          </div>
        </div>

        <div className={styles.scoreBoard}>
          <h3>Round {round}</h3>
          <div className={styles.scores}>
            {Object.entries(scores).map(([player, score]) => (
              <div
                key={player}
                className={`${styles.scoreItem} ${player === cardCzar ? styles.czar : ''}`}
              >
                {player}: {score}
                {player === cardCzar && " 👑"}
              </div>
            ))}
          </div>
        </div>

        {!gameStarted && (
          <div className={styles.lobby}>
            <h2>Waiting Room</h2>
            <div className={styles.players}>
              <h3>Players ({Object.keys(playerMap).length}):</h3>
              <ul>
                {Object.values(playerMap).map((username, idx) => (
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

        {gameStarted && (
          <>
            <div className={styles.gameArea}>
              {isCzar && (
                <div className={styles.czarBanner}>
                  You are the Card Czar! Pick the funniest answer.
                </div>
              )}
              
              {renderQuestion()}

              {gameStatus === "playing" && (
                <>
                  {!isCzar ? (
                    hasSubmitted ? (
                      <div className={styles.waitingMessage}>
                        Waiting for other players...
                      </div>
                    ) : (
                      renderHand()
                    )
                  ) : (
                    <div className={styles.czarWaiting}>
                      Waiting for players to submit their cards...
                    </div>
                  )}
                </>
              )}

              {(gameStatus === "voting" || gameStatus === "results") && renderSubmissions()}

              {gameStatus === "results" && isCreator && (
                <button onClick={nextRound} className={styles.nextRoundButton}>
                  Next Round
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
