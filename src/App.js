import React from 'react';
import NavigationBar from './navBar';
import styles from "./App.module.css";

const categories = [
  { name: "🧠 Trivia", link: "/trivia", color: "blue" },
  { name: "🍻 Je n'ai jamais", link: "/never", color: "orange" },
  { name: "🎉 Picolo", link: "/picolo", color: "pink" },
  { name: "🪢 Pendu", link: "/pendu/pendu_one", color: "red" },
  { name: "😂 Memes culture", link: "/memes", color: "indigo" },
  { name: "🤔 Jeux des problemes", link: "/pb_games", color: "green" },
];

const newGames = [
  { name: "😂 Memes culture", link: "/memes",},
  { name: "🔍 Trivia 2", link: "/trivia/game3" },
  { name: "🤔 Jeux des problemes", link: "/pb_games" }
];

function App() {
  return (
    <>
      <div className={styles['background-image']}></div>  {/* Background layer */}
      <div className={styles.container}>  {/* Scrollable content */}
        <NavigationBar />

        <div className={styles.newBanner}>
          <h2>🆕 Nouveautés</h2>
          <div className={styles.newGamesContainer}>
            {newGames.map((game, index) => (
              <a key={index} href={game.link} className={styles.newGameLink}>
                {game.name}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.cardsContainer}>
          {categories.map((cat, index) => (
            <a key={index} href={cat.link} className={`${styles.card} ${styles[cat.color]}`}>
              {cat.name}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}


export default App;
