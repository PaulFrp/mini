import React, { useState, useEffect } from 'react';
import Card from './card'; // Import the Card component
import stylesCard from './card.module.css'; // Correct import statement
import NavigationBar from '../navBar';
import styles from "./Memes.module.css"; 
import memes from './memes_game4.json';

const Trivia = () => {

  //Create relevant variables 
  const [selectedCard, setSelectedCard] = useState(null);
  const [clickedButtons, setClickedButtons] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHint, setIsHint] = useState(false);

  //Get the card number, add the number that was clicked to the array of clicked buttons and set the card to the question side
  const showCard = (number) => {
    setSelectedCard(number);
    setClickedButtons((prevClickedButtons) => [...prevClickedButtons, number]);
    setIsFlipped(false)
    setIsHint(false)
  };

  //Turn the card around when flipped
  const handleCardClick = () => {
    if(!isFlipped){
        setIsFlipped(true)
    }else{
        setIsFlipped(false)
    }
  };

    const handleHintClick = () => {
    if(!isHint){
        setIsHint(true)
    }else{
        setIsHint(false)
    }
  };

  // Dictionary mapping card numbers to YouTube URLs
  const videoUrls = {};
  for (let i = 1; i <= 21; i++) {
    videoUrls[i] = `${memes[i - 1].video}`;
  }

  const imageUrls = {}
  for (let i = 1; i<=21; i++) {
    imageUrls[i] = `${memes[i - 1].image}`;
  }

  // Get the current video URL based on the selected card
  const currentVideoUrl = selectedCard ? videoUrls[selectedCard] : null;
  const currentImage = selectedCard ? imageUrls[selectedCard] : null;

  //Questions and answers for the trivia 
  const getCardTexts = (number) => {
    console.log(number);
    switch (number) {
        //1ère colomne Easy 
        case 1:
          return { question: `Un entonnoir un entonnoir`, answer: '' };
        case 2: 
          return { question: 'Bah j m appelle fati', answer: '' }; 
        case 3:
          return { question: 'pepper spray', answer: '' }; 
        case 4:
          return { question: 'Ah non c est jason', answer: '' }; 
        case 5:
          return { question: `Enorme Jammy`, answer: '' };
        case 6:
          return { question: `Matière a l école cantine`, answer: '' };
        case 7:
          return { question: 'bah dakor (need to cut la video)', answer: '' }; 
        //2ème columne Medium
        case 8:
           return { question: "bruit du camion de police", answer: '' }; 
        case 9:
          return { question: `Je mange pas le nem`, answer: '' };
        case 10:
          return { question: `Sécurisé avec le cadenas `, answer: '' };
        case 11:
          return { question: `Un ptit wrap`, answer: '' };
        case 12:
          return { question: 'bb kadum', answer: '' }; 
        case 13:
          return { question: `Je suis la je suis plus la`, answer: '' };
        case 14:
          return { question: `J en ai rien a foutre`, answer: '' };
        //3ème columne Hard
        case 15:
          return { question: `Rends moi mes chips`, answer: '' };
        case 16:
          return { question: 'Lee roy jenkins', answer: '' }; 
        case 17:
          return { question: `T es le sdf le plus classe de france`, answer: "" };
        case 18:
          return { question: `Door is stuck`, answer: '' };
        case 19:
          return { question: `T es pas deja un peu baleze la ?`, answer: '' };
        case 20:
          return { question: `Oh Eva tu peux aller chercher ma glace `, answer: '' };
        case 21:
          return { question: `Arrete de Crier !!`, answer: '' };
        // Add more cases as needed
        default:
          return { question: 'Default Question', answer: 'Default Answer' };
      }
  };
         
     
 //Create the constant with the curent question and answer 
  const { question, answer } = selectedCard ? getCardTexts(selectedCard) : { question: '', answer: '' };
 
  return (
    <div className={`${styles['centered-cell']} ${stylesCard['background-image']}`}>
      <NavigationBar/>
      <h1>Welcome to Memes culture 3 </h1>
      <table className={styles['centered-table']}>
        <thead>
          <tr>
            <th className={styles["space-columns"]}>Easy</th>
            <th className={styles["space-columns"]}>Medium</th>
            <th className={styles["space-columns"]}>Hard</th>
          </tr>
        </thead>
        <tbody>
        
          {Array.from({ length: 7 }, (_, rowIndex) => (
            <tr key={rowIndex}>
            {Array.from({ length: 3 }, (_, colIndex) => {
              const buttonNumber = rowIndex + colIndex * 7 + 1;
              const isButtonClicked = clickedButtons.includes(buttonNumber);

              return (
                  <td key={colIndex} className={styles['centered-cell']}>
                  <button
                    onClick={() => showCard(buttonNumber)}
                    className={`${styles.triviaButton} ${isButtonClicked ? styles['red-button'] : ''}`}
                  >
                  {rowIndex}
                  </button>
                  </td>
                   );
               })}
             </tr>
            ))}
        </tbody>
      </table>

      <div className={stylesCard['card-container']}>
      {selectedCard && (
        <div>
        <div className={`${stylesCard['centered-cell']} ${stylesCard['card']}`}>
          <Card  
            image={currentImage} 
            answer={answer} 
            isFlipped={isFlipped} 
            handleCardClick={handleCardClick} 
            videoUrl={currentVideoUrl} 
            />

        </div>
        <div>
          <button onClick={handleHintClick}>Hint</button>
          {isHint && <p>{question}</p>}
        </div>
        
        </div>
        
      )}
    </div>

    </div>
  );
};

export default Trivia;
