import React, { useState } from 'react';
import styles from "./navBar.module.css";

function NavigationBar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", emoji: "🏠", label: "Home" },
    { href: "/trivia", emoji: "🧠", label: "Trivia" },
    { href: "/picolo", emoji: "🎉", label: "Picolo" },
    { href: "/memes", emoji: "😂", label: "Meme culture" },
    { href: "/cards_against_humanity", emoji: "🃏", label: "CAH" },
    { href: "/pb_games", emoji: "🤔", label: "Problèmes" },
    { href: "/never", emoji: "🍻", label: "Never" },
    { href: "/pendu/pendu_one", emoji: "🪢", label: "Pendu" },
    { href: "/make_it_meme", emoji: "😂", label: "MiM" },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoText}>Paul Mini Games</span>
        </a>

        <button 
          className={styles.hamburger}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
        </button>

        <ul className={`${styles.navList} ${isOpen ? styles.active : ''}`}>
          {navItems.map((item, index) => (
            <li key={index} className={styles.navItem}>
              <a href={item.href} className={styles.navLink}>
                <span className={styles.navEmoji}>{item.emoji}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default NavigationBar;