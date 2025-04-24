import React, { useState, useEffect } from 'react';
import Card from "./cardCaH.js"

import NavigationBar from '../navBar';

import q from "./question.json"



const Introduction = ({ onStart }) => {
  //Needed variables definition

  const [usedQuestions, setUsedQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [click, setClick] = useState("b")

  
  const getRandomQuestion = (questions) => {
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

  useEffect(() => {
    getRandomQuestion(q)
  }, [click]);

  const clickTest = () => {
    setClick("a")
  }
  

  //Used to input the selected player s name into the question by replacing the [NAME] element from the question
  const replaceNamePlaceholder = (sentence, name) => {

    if (sentence !=undefined && sentence.includes('[NAME]')) {
        return sentence.replace(/\[NAME\]/g, name);
      } else {
        return sentence;
      }
  };  

  //Display JSX components 
  return (
    
    <div>
      
    <NavigationBar/>

    
        <h1> Test</h1>
        <button onClick={clickTest()}></button>
    
        <div>
        <Card question={selectedQuestion} answer={" "}  title={"test"}/>
        </div>

      
    </div>
  );
};

export default Introduction;
