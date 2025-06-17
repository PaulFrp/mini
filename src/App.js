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

function App() {
  return (
    <div className={styles['background-image']}>
    <div className={styles.container}>
      <NavigationBar />
      <div className={styles.cardsContainer}>
        {categories.map((cat, index) => (
          <a key={index} href={cat.link} className={`${styles.card} ${styles[cat.color]}`}>
            {cat.name}
          </a>
        ))}
      </div>
    </div>
  </div>
  );
}

export default App;
