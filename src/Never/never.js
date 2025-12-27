import React, { useState, useEffect } from 'react';
import q from "./questions.json"
import q_hot from "./question_sex.json"
import NavigationBar from '../navBar';
import styles from "./never.module.css"

const NeverHaveI = () => {

    const [questions, setQuestions] = useState([]);
    const [questionsHot, setQuestionsHot] = useState([]);
    const [usedQuestions, setUsedQuestions] = useState([]);
    const [usedQuestionsHot, setUsedQuestionsHot] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState('');

    useEffect(() => {
        setQuestions(q);
        setQuestionsHot(q_hot)
      }, []); 
    

      const getRandomQuestion = () => {
        if (questions.length === 0) return 'No questions available';
    
        // Filter out used questions
        const availableQuestions = questions.filter(q => !usedQuestions.includes(q));
    
        if (availableQuestions.length === 0) {
          // Reset used questions if all questions have been used
          setUsedQuestions([]);
        }
    
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const newSelectedQuestion = availableQuestions[randomIndex];
    
        // Update used questions list
        setUsedQuestions(prevUsedQuestions => [...prevUsedQuestions, newSelectedQuestion]);
    
        // Set the selected question in state
        setSelectedQuestion(newSelectedQuestion);
      };

      const getRandomQuestionHot = () => {
        if (questionsHot.length === 0) return 'No questions available';
    
        // Filter out used questions
        const availableQuestions = questionsHot.filter(q_hot => !usedQuestionsHot.includes(q_hot));
    
        if (availableQuestions.length === 0) {
          // Reset used questions if all questions have been used
          setUsedQuestionsHot([]);
        }
    
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const newSelectedQuestion = availableQuestions[randomIndex];
    
        // Update used questions list
        setUsedQuestions(prevUsedQuestions => [...prevUsedQuestions, newSelectedQuestion]);
    
        // Set the selected question in state
        setSelectedQuestion(newSelectedQuestion);
      };

  return (
    <div className={`${styles['centered-cell']} ${styles['background-image']}`}>
      <NavigationBar/>
      <div className={styles['content']}>
      <div className={styles['container']}>
        <h1 className={styles['title']}>🍻 Never Have I Ever</h1>
        
        <div className={styles['button-group']}>
          <button 
            className={styles['button']} 
            onClick={() => getRandomQuestion()}
          >
            🎲 Get Random Question
          </button>
          <button 
            className={`${styles['button']} ${styles['button-hot']}`}
            onClick={() => getRandomQuestionHot()}
          >
            🔥 Get Hot Questions
          </button>
        </div>

        {selectedQuestion && (
          <div className={styles['question-display']}>
            <p className={styles['question-text']}>
              Never have I ever... <br/> {selectedQuestion}
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default NeverHaveI;
