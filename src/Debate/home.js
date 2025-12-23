import React, { useState, useEffect } from 'react';
import Card from "./cardPicolo.js"
import styles from "./cardPicolo.module.css"
import NavigationBar from '../navBar.js';

import question from "./question.json"; 


const Introduction = ({ onStart }) => {

  const [started, setStarted] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');


  const handleStartGame = () => {
    setStarted(true)
  };

  
  const getRandomQuestion = (questions) => {
    setQuestions(questions)
    if (questions.length === 0) return 'No questions available';

    // Filter out used questions
    const availableQuestions = questions.filter(questions => !usedQuestions.includes(questions));

    if (availableQuestions.length === 0) {
      // Reset used questions if all questions have been used
      setUsedQuestions([]);
      console.log("a plus");
    }

    //Select a random question from the available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const newSelectedQuestion = availableQuestions[randomIndex];

    // Update used questions list
    setUsedQuestions(prevUsedQuestions => [...prevUsedQuestions, newSelectedQuestion]);

    // Set the selected question in state
    setSelectedQuestion(newSelectedQuestion);
  };



  //Display JSX components 
  return (
    
    <div>
    <NavigationBar/>

    {started && (
    <div className={`${styles['centered-cell']} ${styles[cardType + '-bg']} ${styles['full-screen-bg']}`}>

    <div className={styles['container']}>
      <div className={styles['left-container']}> 
      <img src='/images/picolo/beers.png'
        className={`${styles["img-beers"]}`}/> 
    </div>

    <h1 className={styles['h1-center']}>Welcome to Picolo</h1>

    <div className={styles['right-container']}> 
      <img src='/images/picolo/beers.png'
        className={`${styles["img-beers"]}`}/> 
    </div>
    </div>
    <button className={`${styles['margin-button']} ${styles['button_improved']}`} onClick={getRandomQuestion(question)}>Get Question</button>

    {selectedPlayer && (
        <div>
        <Card question={selectedQuestion} answer={" "}  title={"Débat"}/>
        </div>
    )}

        </div>
    )}
      
    </div>
  );
};

export default Introduction;
