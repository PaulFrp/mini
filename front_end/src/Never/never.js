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
      <h1>Welcome to Never have i ever </h1>

      <button onClick={() => getRandomQuestion()}>
        Get Random Question
      </button>

      <button onClick={() => getRandomQuestionHot()}>
        Get sex questions
      </button>
      {selectedQuestion && <h1>{selectedQuestion}</h1>}


    </div>

    
  );
};

export default NeverHaveI;
