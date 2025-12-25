import React from 'react';
import NavigationBar from '../navBar';
import styles from "./Memes.module.css";

const categories = [
  { 
    name: "Memes Culture 1", 
    emoji: "🎯",
    description: "Les classiques",
    link: "/memes/game1", 
    color: "teal" 
  },
  { 
    name: "Memes Culture 2", 
    emoji: "🔍",
    description: "Niveau intermédiaire",
    link: "/memes/game2", 
    color: "indigo" 
  },
  { 
    name: "Memes Culture 3", 
    emoji: "🎪",
    description: "Pour les connaisseurs",
    link: "/memes/game3", 
    color: "blue" 
  },
  { 
    name: "Memes Culture 4", 
    emoji: "🎨",
    description: "Niveau avancé",
    link: "/memes/game4", 
    color: "orange" 
  },
  { 
    name: "Memes Culture 5", 
    emoji: "🎭",
    description: "Références obscures",
    link: "/memes/game5", 
    color: "pink" 
  },
  { 
    name: "Memes Culture 6", 
    emoji: "🎬",
    description: "Pour les experts",
    link: "/memes/game6", 
    color: "red" 
  },
  { 
    name: "Memes Culture 7", 
    emoji: "👑",
    description: "Niveau légendaire",
    link: "/memes/game7", 
    color: "purple" 
  }
];

function App() {
  return (
    <>
      <div className={styles['background-image']}></div>
      <NavigationBar />
      <div className={styles.container}>
        <div className={styles.cardsContainer}>
          {categories.map((cat, index) => (
            <a key={index} href={cat.link} className={`${styles.card} ${styles[cat.color]}`}>
              <div className={styles.cardEmoji}>{cat.emoji}</div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{cat.name}</h3>
                <p className={styles.cardDescription}>{cat.description}</p>
              </div>
              <div className={styles.cardArrow}>→</div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;