import React, { useState } from 'react';
import styles from './cah.module.css'; // Correct import statement

const Card = ({ question, answer, isFlipped, handleCardClick, title}) => {



  return (
    <div className={`${styles.card} ${isFlipped ? styles['card-flipped'] : ''}`} onClick={handleCardClick}>
      <div className={styles['card-content']}>
        <div className={`${styles['card-front']} ${styles[title + '-card']}`}>
          <b>{title}</b>
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