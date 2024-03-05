import React, { useState, useEffect } from 'react';
import Card from "./cardPicolo.js"
import styles from "./cardPicolo.module.css"

import q_hot from "./question_hot.json"; 
import q_meuf from "./question_meuf.json"
import q_mec from "./question_mec.json"
import q_everyone from "./question_everyone.json"
import q_punition from "./question_punition.json"
import q_normal from "./question_normal.json"

const Introduction = ({ onStart }) => {

  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [sex, setSex] = useState('');
  const [started, setStarted] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("")

  const [questions, setQuestions] = useState([]);
  const [questionsHot, setQuestionsHot] = useState([]);
  const [questionsMeuf, setQuestionsMeuf] = useState([]);
  const [questionsMec, setQuestionsMec] = useState([]);
  const [questionsEveryone, setQuestionsEveryone] = useState([]);
  const [questionsPunition, setQuestionsPunition] = useState([]);

  const [cardType, setCardType] = useState("");
  const [randomCard, setRandomCard] = useState("");
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');


  const handleAddPlayer = () => {
    if (name.trim() !="") {
      setPlayers([...players, { name, sex }]);
      setName('');
      setSex('');
     
    }
    
  };

  const handleStartGame = () => {
    setStarted(true)
  };

  const getRandomQuestion = (questions) => {
    if (questions.length === 0) return 'No questions available';

    // Filter out used questions
    const availableQuestions = questions.filter(questions => !usedQuestions.includes(questions));

    if (availableQuestions.length === 0) {
      // Reset used questions if all questions have been used
      setUsedQuestions([]);
      console.log("a plus");
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const newSelectedQuestion = availableQuestions[randomIndex];

    // Update used questions list
    setUsedQuestions(prevUsedQuestions => [...prevUsedQuestions, newSelectedQuestion]);

    // Set the selected question in state
    setSelectedQuestion(newSelectedQuestion);
  };

  const getQuestion = () => {
    // peut etre pas une bonne idee de load au moment ou la fonction s execute
    setQuestionsHot(q_hot)
    setQuestions(q_normal)
    setQuestionsMeuf(q_meuf)
    setQuestionsMec(q_mec)
    setQuestionsPunition(q_punition)
    setQuestionsEveryone(q_everyone)
    
    
      const randomIndex = Math.floor(Math.random() * players.length);
      setSelectedPlayer(players[randomIndex])

      //Logique to know which card to get
      //Proba questions: normal 10% puntion: 10% hot: 40% mec/meuf: 20% everyone: 20%
      // I think there is an issue when the same card come in twice
       setRandomCard(Math.floor(Math.random() * 10) +1);

      console.log(randomCard);
      if(randomCard<=4){
        setCardType("hot")
      }else if (randomCard>4 && randomCard<=6){
        setCardType("mec-meuf")
      }else if(randomCard>6 && randomCard <=8){
        setCardType("everyone")
      }else if(randomCard == 9){
        setCardType("normal")
      }else if(randomCard == 10){
        setCardType("punition")
      }

  }

  const replaceNamePlaceholder = (sentence, name) => {

    if (sentence !=undefined && sentence.includes('[NAME]')) {
        return sentence.replace(/\[NAME\]/g, name);
      } else {
        return sentence;
      }
  };

  useEffect(() => {

    if (selectedPlayer && cardType) {

        console.log(cardType);
      if (cardType == "mec-meuf") {
        if(selectedPlayer.sex == "male"){
            getRandomQuestion(questionsMec);
        }else if (selectedPlayer.sex == "meuf") {
            getRandomQuestion(questionsMeuf);
        }

      }else if (cardType == "everyone") {
        getRandomQuestion(questionsEveryone)
      }else if (cardType == "hot") {
        getRandomQuestion(questionsHot)
      }else if (cardType == "normal") {
        getRandomQuestion(questions)
      }else if(cardType == "punition"){
        getRandomQuestion(questionsPunition)
      }
    }
  }, [selectedPlayer, cardType, questionsMeuf, questionsMec, questionsEveryone, questionsHot, questions, questionsPunition, randomCard]);

  return (
    <div>
    {!started && (
    <>
    <h1>Welcome to the Game</h1>
      <label>
        Name:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Sex:
        <select value={sex} onChange={(e) => setSex(e.target.value)}>
          <option value=""> </option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
      </label>
      <button onClick={handleAddPlayer}>Add Player</button>
      <button onClick={handleStartGame} disabled={players.length === 0}>
        Start Game
      </button>
      <ul>
        {players.map((player, index) => (
          <li key={index}>
            {player.name} - {player.sex}
          </li>
        ))}
      </ul>
    </>
    )
        
    }

    {started && (
    <div className={`${styles['centered-cell']} ${styles[cardType + '-bg']} ${styles['full-screen-bg']}`}>
    <h1>Welcome to Picolo</h1>
    <button className={`${styles['margin-button']} ${styles['button_improved']}`} onClick={getQuestion}>Get Question</button>

    {selectedPlayer && (
        <div>
        <Card question={replaceNamePlaceholder(selectedQuestion, selectedPlayer.name)} answer={" "}  title={cardType}/>
        </div>
    )}

        </div>
    )}
      
    </div>
  );
};

export default Introduction;
