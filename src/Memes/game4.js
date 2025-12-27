import React, { useState, useEffect, useMemo } from 'react';
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

  // Map cards by their id so button number matches JSON id regardless of array order
  const cardLookup = useMemo(() => {
    const map = new Map();
    memes.forEach((card) => {
      const idNumber = parseInt(card.id, 10);
      if (!Number.isNaN(idNumber)) {
        map.set(idNumber, card);
      }
    });
    return map;
  }, []);

  const currentCard = selectedCard ? cardLookup.get(selectedCard) : null;
  const currentVideoUrl = currentCard?.video ?? null;
  const currentImage = currentCard?.image ?? null;

  const totalCards = cardLookup.size;
  const rows = 7; // fixed 7 rows, 3 columns

  //Questions and answers for the trivia 
  const getCardTexts = (number) => {
    console.log(number);
    switch (number) {
        //1ère colomne Easy 
        case 1:
          return { question: `Pen, pineapple pen`, answer: '' };
        case 2: 
          return { question: 'On m a demandé de rendre service', answer: '' }; 
        case 3:
          return { question: 'pepper spray', answer: '' }; 
        case 4:
          return { question: 'megotcule', answer: '' }; 
        case 5:
          return { question: `Enorme Jammy`, answer: '' };
        case 6:
          return { question: `ICE guy`, answer: '' };
        case 7:
          return { question: 'Et vous paul ?', answer: '' }; 
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
    <div className={styles['centered-cell']}>
      <div className={stylesCard['background-image']}></div>
      <NavigationBar/>
      <div className={styles['gameHeader']}>
        <h1>😂 Memes Culture 4</h1>
      </div>
      <table className={styles['centered-table']}>
        <thead>
          <tr>
            <th className={styles["space-columns"]}>Easy</th>
            <th className={styles["space-columns"]}>Medium</th>
            <th className={styles["space-columns"]}>Hard</th>
          </tr>
        </thead>
        <tbody>
        
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
            {Array.from({ length: 3 }, (_, colIndex) => {
              const buttonNumber = rowIndex + colIndex * rows + 1;
              if (buttonNumber > totalCards) {
                return <td key={colIndex} className={styles['centered-cell']}></td>;
              }
              const isButtonClicked = clickedButtons.includes(buttonNumber);

              return (
                  <td key={colIndex} className={styles['centered-cell']}>
                  <button
                    onClick={() => showCard(buttonNumber)}
                    className={`${styles.triviaButton} ${isButtonClicked ? styles['red-button'] : ''}`}
                  >
                  {buttonNumber}
                  </button>
                  </td>
                   );
               })}
             </tr>
            ))}
        </tbody>
      </table>

      <div className={stylesCard['card-container']}>
        {selectedCard ? (
          <div>
            <div className={stylesCard['centered-cell']}>
              <Card  
                image={currentImage} 
                answer={answer} 
                isFlipped={isFlipped} 
                handleCardClick={handleCardClick} 
                videoUrl={currentVideoUrl} 
              />
            </div>
            <div>
              <button className={stylesCard['hintButton']} onClick={handleHintClick}>
                {isHint ? '🙈 Masquer l\'indice' : '💡 Afficher l\'indice'}
              </button>
              {isHint ? (
                <p className={stylesCard['hintText']}>{question}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Trivia;
