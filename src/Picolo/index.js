import React, { useState, useEffect } from 'react';
import Card from "./cardPicolo.js"
import styles from "./cardPicolo.module.css"
import NavigationBar from '../navBar';

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
       setRandomCard(Math.floor(Math.random() * 253) +1);

      console.log(randomCard);
      if(randomCard<=66){
        setCardType("hot")
      }else if (randomCard>66 && randomCard<=101){
        setCardType("mec-meuf")
      }else if(randomCard>101 && randomCard <=185){
        setCardType("everyone")
      }else if(randomCard>185 && randomCard <= 224){
        setCardType("normal")
      }else if(randomCard>224){
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
      console.log(selectedPlayer.sex);
      console.log(cardType);
      
      if (cardType === "mec-meuf") {
        if (selectedPlayer.sex === "male") {
          getRandomQuestion(questionsMec);
          console.log("worked mec");
        } else if (selectedPlayer.sex === "female") {
          getRandomQuestion(questionsMeuf);
          console.log("worked meuf");
        } else {
          console.log("error");
        }
      } else if (cardType === "everyone") {
        getRandomQuestion(questionsEveryone);
        console.log("worked everyone");
      } else if (cardType === "hot") {
        getRandomQuestion(questionsHot);
        console.log("worked hot");
      } else if (cardType === "normal") {
        getRandomQuestion(questions);
        console.log("worked normal");
      } else if (cardType === "punition") {
        getRandomQuestion(questionsPunition);
        console.log("worked punition");
      } else {
        console.log("error first rotation");
      }
    }
  }, [selectedPlayer, cardType, questionsMeuf, questionsMec, questionsEveryone, questionsHot, questions, questionsPunition, randomCard]);
  

  return (
    
    <div>
      
      
    {!started && (
    
    <div className={`${styles['confetti-background']}`}>
    <div className={styles['overlay-image']}></div>
   

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
    
    <div className={styles['form-design']}> 
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
      <br/>
      <button className={`${styles['margin-top-button']} ${styles['button_improved']}`} onClick={handleAddPlayer}>Add Player</button>
      <button className={`${styles['margin-top-button']} ${styles['button_improved']}`} onClick={handleStartGame} disabled={players.length === 0}>
        Start Game
      </button>
      <ul>
        {players.map((player, index) => (
          <p key={index}>
            {player.name} - {player.sex}
          </p>
        ))}
      </ul>
    </div>
    </div>
    )}

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
