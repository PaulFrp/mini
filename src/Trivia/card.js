import React, { useState } from 'react';
import styles from './card.module.css'; // Correct import statement

const Card = ({ question, answer, isFlipped, handleCardClick }) => {



  return (
    <div className={`${styles.card} ${isFlipped ? styles['card-flipped'] : ''}`} onClick={handleCardClick}>
      <div className={styles['card-content']}>
        <div className={styles['card-front']}>
          <p>{question}</p>
        </div>
        <div className={styles['card-back']}>
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;
