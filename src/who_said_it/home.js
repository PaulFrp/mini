import React from 'react';
import NavigationBar from '../navBar';
import styles from "../App.module.css";

const categories = [
  { name: "🎯 Who said it ?", link: "/who_said_it/game1", color: "teal" },
  
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