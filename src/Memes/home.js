import React from 'react';
import NavigationBar from '../navBar';
import styles from "../App.module.css";

const categories = [
  { name: "🎯 Memes culture 1", link: "/memes/game1", color: "teal" },
  { name: "🔍 Memes Culture 2", link: "/memes/game2", color: "indigo" },
  { name: "🔍 Memes Culture 3", link: "/memes/game3", color: "blue" },
  { name: "🔍 Memes Culture 4", link: "/memes/game4", color: "orange" },
  { name: "🔍 Memes Culture 5", link: "/memes/game5", color: "pink" },
  { name: "🔍 Memes Culture 6", link: "/memes/game6", color: "red" },
  { name: "🔍 Memes Culture 6", link: "/memes/game7", color: "gray" }
  
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