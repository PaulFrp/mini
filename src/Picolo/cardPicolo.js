import React, { useState } from 'react';
import styles from './cardPicolo.module.css'; // Correct import statement

const Card = ({ question, answer, isFlipped, handleCardClick, title}) => {
  const flipped = Boolean(isFlipped);

  return (
    <div
      className={`${styles.card} ${flipped ? styles['card-flipped'] : styles['card-static']}`}
      onClick={handleCardClick}
    >
      <div className={styles['card-content']}>
        <div className={`${styles['card-front']} ${styles[title + '-card']}`}>
          <b>{title}</b>
          <p>{question}</p>
        </div>
        {flipped && (
          <div className={styles['card-back']}>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;