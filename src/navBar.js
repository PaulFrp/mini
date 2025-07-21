import React from 'react';
import styles from "./navBar.module.css"; // Import CSS file

function NavigationBar() {
  return (
    <nav className={styles.navbar}> {/* Add className */}
      <ul>
        <li><a href="/">🏠Home</a></li>
        <li><a href="/trivia">🧠Trivia</a></li>
        <li><a href="/picolo">🎉Picolo</a></li>
        <li><a href="/memes">😂Memes culture</a></li>
        <li><a href="/pb_games">🤔Jeux des problemes</a></li>
        <li><a href="/never">🍻Je n'ai jamais</a></li>
        <li><a href="/pendu/pendu_one">🪢Pendu</a></li>
        <li><a href="/make_it_meme">😂Make It Meme</a></li>
      </ul>
    </nav>
  );
}

export default NavigationBar;