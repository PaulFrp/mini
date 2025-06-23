import React from 'react';
import NavigationBar from '../navBar';
import styles from "../App.module.css";

const categories = [
  { name: "🎯 Trivia 1", link: "/trivia/game1", color: "teal" },
  { name: "🔍 Trivia 3", link: "/trivia/game3", color: "indigo" },
  { name: "🔍 Trivia 4", link: "/trivia/game4", color: "orange" }
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