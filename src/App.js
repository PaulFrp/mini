import React from 'react';
import NavigationBar from './navBar';
import styles from "./App.module.css";

const categories = [
  { 
    name: "Trivia", 
    emoji: "🧠",
    description: "Testez vos connaissances",
    link: "/trivia", 
    color: "blue" 
  },
  { 
    name: "Picolo", 
    emoji: "🎉",
    description: "Jeu de soirée classique",
    link: "/picolo", 
    color: "pink" 
  },
  { 
    name: "Memes Culture", 
    emoji: "😂",
    description: "Pour les connaisseurs",
    link: "/memes", 
    color: "indigo" 
  },
  { 
    name: "Cards Against Humanity", 
    emoji: "🃏",
    description: "Humour noir garanti",
    link: "/cards_against_humanity", 
    color: "purple" 
  },
  { 
    name: "Jeux des Problèmes", 
    emoji: "🤔",
    description: "Situations impossibles",
    link: "/pb_games", 
    color: "green" 
  },
  { 
    name: "Je n'ai Jamais", 
    emoji: "🍻",
    description: "Révélations garanties",
    link: "/never", 
    color: "orange" 
  },
  { 
    name: "Pendu", 
    emoji: "🪢",
    description: "Classique revisité",
    link: "/pendu/pendu_one", 
    color: "red" 
  },
  { 
    name: "Make it Meme", 
    emoji: "😂",
    description: "Créativité et rires",
    link: "/make_it_meme", 
    color: "indigo" 
  },
];

const newGames = [
  { 
    name: "Make it Meme", 
    emoji: "😂",
    link: "/make_it_meme",
    badge: "Nouveau"
  },
   { 
    name: "Cards Against Humanity", 
    emoji: "🃏",
    link: "/cards_against_humanity", 
    badge: "Nouveau"
  }
];

function App() {
  return (
    <>
      <div className={styles['background-image']}></div>
      <div className={styles.container}>
        <NavigationBar />

        <div className={styles.newBanner}>
          <div className={styles.bannerHeader}>
            <span className={styles.sparkle}>✨</span>
            <h2>Nouveautés</h2>
            <span className={styles.sparkle}>✨</span>
          </div>
          <div className={styles.newGamesContainer}>
            {newGames.map((game, index) => (
              <a key={index} href={game.link} className={styles.newGameCard}>
                <span className={styles.newGameEmoji}>{game.emoji}</span>
                <span className={styles.newGameName}>{game.name}</span>
                <span className={styles.badge}>{game.badge}</span>
              </a>
            ))}
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <h2>Tous les jeux</h2>
          <p>Choisissez votre aventure</p>
        </div>

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
