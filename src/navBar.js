import React from 'react';
import styles from "./navBar.module.css"; // Import CSS file

function NavigationBar() {
  return (
    <nav className={styles.navbar}> {/* Add className */}
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/trivia">Trivia 1</a></li>
        <li><a href="/trivia/game2">Trivia 2</a></li>
        <li><a href="/trivia/game3">Trivia 3</a></li>
        <li><a href="/never">Je n'ai jamais</a></li>
        <li><a href="/picolo">Picolo</a></li>
        <li><a href="/pendu/pendu_one">Pendu</a></li>
      </ul>
    </nav>
  );
}

export default NavigationBar;