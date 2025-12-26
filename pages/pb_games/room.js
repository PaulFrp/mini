import styles from "./RoomPage.module.css";
import NavigationBar from "../../src/navBar";
import { useEffect, useState, useRef } from "react";

function getClientId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("client_id");
  if (!id) {
    if (window.crypto && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (
          c ^ (window.crypto && crypto.getRandomValues
            ? crypto.getRandomValues(new Uint8Array(1))[0]
            : Math.random() * 16
          ) & 15 >> c / 4
        ).toString(16)
      );
    }
    localStorage.setItem("client_id", id);
  }
  return id;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL !== undefined ? process.env.NEXT_PUBLIC_BACKEND_URL : "http://localhost:8000").replace(/\/$/, '');

export default function PBGamesRoom() {
  const [clientId, setClientId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [playerMap, setPlayerMap] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  
  // Voting state
  const [question, setQuestion] = useState("");
  const [players, setPlayers] = useState([]);
  const [votesCount, setVotesCount] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingFinished, setVotingFinished] = useState(false);
  const [winners, setWinners] = useState([]);
  const [voteDetails, setVoteDetails] = useState({});
  const [hasNextQuestion, setHasNextQuestion] = useState(true);

  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const pollingIntervalRef = useRef(null);
  const pollRequestSeqRef = useRef(0); // tracks poll requests to drop stale responses
  const lastProcessedSeqRef = useRef(0); // latest processed poll response
  const questionRef = useRef(""); // track the active question to detect round changes
  const votingFinishedRef = useRef(false); // keep latest value inside polling callback

  // Initialize client ID
  useEffect(() => {
    const id = getClientId();
    setClientId(id);
    try {
      const rid = localStorage.getItem("room_id");
      if (rid) setRoomId(rid);
    } catch {}
  }, []);

  // Fetch room data and game status
  useEffect(() => {
    if (!clientId) return;

    const headers = { "x-client-id": clientId };
    if (roomId) headers["x-room-id"] = roomId;

    const fetchRoomData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/room_messages`, {
          credentials: "include",
          headers,
        });
        const data = await res.json();
        
        if (data.room_id) {
          setRoomId(data.room_id);
          localStorage.setItem("room_id", data.room_id);
          setIsCreator(data.is_creator);
          setPlayerMap(data.player_map || {});
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching room data:", err);
        setError("Failed to load room data");
        setLoading(false);
      }
    };

    fetchRoomData();
    // Poll room data every 1.5 seconds to refresh player list
    const roomDataIntervalRef = setInterval(fetchRoomData, 1500);

    return () => {
      clearInterval(roomDataIntervalRef);
    };
  }, [clientId]);

  // Keep a fresh reference of votingFinished inside callbacks
  useEffect(() => {
    votingFinishedRef.current = votingFinished;
  }, [votingFinished]);

  // Poll game status
  useEffect(() => {
    if (!roomId || !clientId) return;

    const updateRemaining = (newRemaining, isNewQuestion = false) => {
      if (newRemaining == null || Number.isNaN(newRemaining)) return;
      const sanitized = Math.max(Math.floor(newRemaining), 0);
      setRemaining((prev) => {
        if (prev == null || isNewQuestion) return sanitized;
        // Prevent timer from jumping backwards because of slow/stale responses
        return Math.min(prev, sanitized);
      });
    };

    const pollGameStatus = async () => {
      const requestSeq = ++pollRequestSeqRef.current;
      try {
        const res = await fetch(`${BACKEND_URL}/voting/game_status/${roomId}`, {
          credentials: "include",
          headers: { "x-client-id": clientId },
        });
        const data = await res.json();

        // Drop out-of-order responses (can happen with higher latency on Heroku)
        if (requestSeq < lastProcessedSeqRef.current) {
          return;
        }
        lastProcessedSeqRef.current = requestSeq;

        const isVoting = data.status === "voting";
        const isFinished = data.status === "finished";
        const nextQuestion = data.question || "";
        const isNewQuestion = isVoting && nextQuestion !== questionRef.current;

        if (isVoting) {
          // Avoid regressions: if we already marked the round as finished, only allow
          // returning to voting when we detect a new question.
          if (votingFinishedRef.current && !isNewQuestion) {
            updateRemaining(data.remaining, false);
            return;
          }

          questionRef.current = nextQuestion;
          setGameStarted(true);
          setQuestion(nextQuestion);
          setPlayers(data.players || []);
          setVotesCount(data.votes_count || 0);
          setVotingFinished(false);
          setWinners([]);
          setVoteDetails({});

          const hasCurrentClientVoted = data.voters && data.voters.includes(clientId);
          setHasVoted(hasCurrentClientVoted || false);
          updateRemaining(data.remaining, isNewQuestion);
        } else if (isFinished) {
          questionRef.current = nextQuestion || questionRef.current;
          setGameStarted(true);
          setVotingFinished(true);
          setWinners(data.winners || []);
          setVoteDetails(data.vote_counts || {});
          setHasNextQuestion(data.has_next_question || false);
          updateRemaining(0, false);
        } else if (data.status === "no_game") {
          // If no game exists, return to lobby
          setGameStarted(false);
        }
      } catch (err) {
        console.error("Error polling game status:", err);
      }
    };

    pollGameStatus();
    pollingIntervalRef.current = setInterval(pollGameStatus, 1000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [roomId, clientId]);

  const handleStartGame = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/voting/start_game/${roomId}`, {
        method: "POST",
        credentials: "include",
        headers: { "x-client-id": clientId },
      });
      const data = await res.json();
      if (data.status === "game started") {
        setGameStarted(true);
      }
    } catch (err) {
      console.error("Error starting game:", err);
    }
  };

  const handleVote = async (player) => {
    if (hasVoted || votingFinished) return;

    // Optimistically set hasVoted to true immediately for better UX
    setHasVoted(true);

    try {
      const res = await fetch(`${BACKEND_URL}/voting/vote/${roomId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "x-client-id": clientId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voter_id: clientId,
          vote_for: player,
        }),
      });
      if (!res.ok) {
        // If vote failed, reset the state
        setHasVoted(false);
        console.error("Vote submission failed");
      }
    } catch (err) {
      // If vote failed, reset the state
      setHasVoted(false);
      console.error("Error voting:", err);
    }
  };

  const handleNextQuestion = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/voting/next_question/${roomId}`, {
        method: "POST",
        credentials: "include",
        headers: { "x-client-id": clientId },
      });
      const data = await res.json();
      if (data.status === "voting") {
        setQuestion(data.question);
        setVotingFinished(false);
        setHasVoted(false);
        setVotesCount(0);
        setWinners([]);
      } else if (data.status === "game_over") {
        setGameStarted(false);
      }
    } catch (err) {
      console.error("Error fetching next question:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <NavigationBar />
        <div className={styles.loadingMessage}>Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <NavigationBar />
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <NavigationBar />
      <div className={styles.gameContainer}>
        <h1 className={styles.title}>PB Games - Voting</h1>
        
        {!gameStarted ? (
          <div className={styles.lobbySection}>
            <h2 className={styles.roomTitle}>🎮 Room {roomId}</h2>
            <p className={styles.creatorNote}>
              {isCreator ? "👑 You are the creator" : "⏳ Waiting for creator to start..."}
            </p>
            
            <div className={styles.playersListSection}>
              <h3 className={styles.playersTitle}>Players in Room ({Object.keys(playerMap).length})</h3>
              <div className={styles.playersGrid}>
                {Object.keys(playerMap).length > 0 ? (
                  Object.entries(playerMap).map(([clientId, username]) => (
                    <div key={clientId} className={styles.playerCard}>
                      <div className={styles.playerAvatar}>
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.playerName}>{username}</div>
                    </div>
                  ))
                ) : (
                  <p className={styles.noPlayers}>No players yet...</p>
                )}
              </div>
            </div>

            {isCreator && (
              <button className={styles.startButton} onClick={handleStartGame}>
                🎬 Start Game
              </button>
            )}
          </div>
        ) : (
          <div className={styles.gameSection}>
            <div className={styles.questionBox}>
              <h2 className={styles.question}>{question}</h2>
            </div>

            {!votingFinished ? (
              <div className={styles.votingSection}>
                <div className={styles.timerBox}>
                  <span className={remaining <= 5 ? styles.timerCritical : ""}>
                    ⏱️ {remaining}s
                  </span>
                </div>

                <div className={styles.playersVoting}>
                  <h3>Vote for a player:</h3>
                  <div className={styles.playersList}>
                    {players.map((player) => (
                      <button
                        key={player}
                        className={`${styles.playerButton} ${
                          hasVoted ? styles.disabled : ""
                        }`}
                        onClick={() => handleVote(player)}
                        disabled={hasVoted}
                      >
                        {player}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.voteStatus}>
                  {hasVoted ? (
                    <p className={styles.voted}>✅ You have voted!</p>
                  ) : (
                    <p className={styles.notVoted}>Vote for your favorite answer</p>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.resultsSection}>
                <h3 className={styles.resultsTitle}>🏆 Results</h3>
                <div className={styles.winners}>
                  {Object.keys(voteDetails).length > 0 ? (
                    <>
                      <p>Vote Results:</p>
                      {winners.length > 0 && (
                        <div className={styles.winnersGroup}>
                          <p className={styles.winnersLabel}>Winners:</p>
                          {winners.map((winner) => (
                            <div key={winner} className={styles.winnerBadge}>
                              👑 {winner} - {voteDetails[winner]} votes
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={styles.allVotesGroup}>
                        <p className={styles.allVotesLabel}>All Results:</p>
                        {Object.entries(voteDetails).map(([name, count]) => (
                          <div key={name} className={styles.voteResultItem}>
                            {name}: {count} {count === 1 ? 'vote' : 'votes'}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p>No votes recorded</p>
                  )}
                </div>

                {isCreator && hasNextQuestion && (
                  <button
                    className={styles.nextButton}
                    onClick={handleNextQuestion}
                  >
                    Next Question
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}