import React from 'react';
import NavigationBar from './navBar';
import styles from "./App.module.css";

const categories = [
  { name: "🧠 Trivia", link: "/trivia", color: "blue" },
  { name: "🎉 Picolo", link: "/picolo", color: "pink" },
  { name: "😂 Memes culture", link: "/memes", color: "indigo" },
  { name: "🤔 Jeux des problemes", link: "/pb_games", color: "green" },
  { name: "🍻 Je n'ai jamais", link: "/never", color: "orange" },
  { name: "🪢 Pendu", link: "/pendu/pendu_one", color: "red" },
  { name: "😂 Make it Meme", link: "/make_it_meme", color: "indigo" },
];

const newGames = [
  { name: "🤔 Jeux des problemes", link: "/pb_games" },
  { name: "😂 Make it Meme", link: "/make_it_meme" }
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
