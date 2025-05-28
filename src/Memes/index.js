import React, { useState, useEffect } from 'react';
import Card from './card'; // Import the Card component
import styles from './card.module.css'; // Correct import statement
import NavigationBar from '../navBar';


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
  const videoUrls = {
    1: "https://www.youtube.com/embed/3IDIlooy0HA",
    2: "https://www.youtube.com/embed/VIDEO_ID_2",
    3: "https://www.youtube.com/embed/VIDEO_ID_3",
    4: "https://www.youtube.com/embed/VIDEO_ID_4",
    5: "https://www.youtube.com/embed/VIDEO_ID_5",
    6: "https://www.youtube.com/embed/VIDEO_ID_6",
    7: "https://www.youtube.com/embed/VIDEO_ID_7",
    8: "https://www.youtube.com/embed/VIDEO_ID_8",
    9: "https://www.youtube.com/embed/VIDEO_ID_9",
    10: "https://www.youtube.com/embed/VIDEO_ID_10",
    11: "https://www.youtube.com/embed/VIDEO_ID_11",
    12: "https://www.youtube.com/embed/VIDEO_ID_12",
    13: "https://www.youtube.com/embed/VIDEO_ID_13",
    14: "https://www.youtube.com/embed/VIDEO_ID_14",
    15: "https://www.youtube.com/embed/VIDEO_ID_15",
    16: "https://www.youtube.com/embed/VIDEO_ID_16",
    17: "https://www.youtube.com/embed/VIDEO_ID_17",
    18: "https://www.youtube.com/embed/VIDEO_ID_18",
    19: "https://www.youtube.com/embed/VIDEO_ID_19",
    20: "https://www.youtube.com/embed/VIDEO_ID_20",
    21: "https://www.youtube.com/embed/VIDEO_ID_21",
    // Add more mappings as needed
  };

  const imageUrls = {
    1: "/images/memes/code.png",
    3: "https://www.youtube.com/embed/VIDEO_ID_3",
    2: "https://www.youtube.com/embed/VIDEO_ID_2",
    4: "https://www.youtube.com/embed/VIDEO_ID_4",
    5: "https://www.youtube.com/embed/VIDEO_ID_5",
    6: "https://www.youtube.com/embed/VIDEO_ID_6",
    7: "https://www.youtube.com/embed/VIDEO_ID_7",
    8: "https://www.youtube.com/embed/VIDEO_ID_8",
    9: "https://www.youtube.com/embed/VIDEO_ID_9",
    10: "https://www.youtube.com/embed/VIDEO_ID_10",
    11: "https://www.youtube.com/embed/VIDEO_ID_11",
    12: "https://www.youtube.com/embed/VIDEO_ID_12",
    13: "https://www.youtube.com/embed/VIDEO_ID_13",
    14: "https://www.youtube.com/embed/VIDEO_ID_14",
    15: "https://www.youtube.com/embed/VIDEO_ID_15",
    16: "https://www.youtube.com/embed/VIDEO_ID_16",
    17: "https://www.youtube.com/embed/VIDEO_ID_17",
    18: "https://www.youtube.com/embed/VIDEO_ID_18",
    19: "https://www.youtube.com/embed/VIDEO_ID_19",
    20: "https://www.youtube.com/embed/VIDEO_ID_20",
    21: "https://www.youtube.com/embed/VIDEO_ID_21",
    // Add more mappings as needed
  };

  // Get the current video URL based on the selected card
  const currentVideoUrl = selectedCard ? videoUrls[selectedCard] : null;
  const currentImage = selectedCard ? imageUrls[selectedCard] : null;

  //Questions and answers for the trivia 
  const getCardTexts = (number) => {
    console.log(number);
    switch (number) {
        //1ère colomne Easy 
        case 1:
          return { question: `Le premier savant de toute la république démocratique du Congo ? `, answer: 'EDDY MALOU' };
        case 4: 
          return { question: 'Tu crois que c est du respect ? ', answer: 'Tu crois que c est du respect mon garcon ? ' }; 
        case 7:
          return { question: '8 morts 6 blessés ?', answer: 'Je pète ma bière, MA "LUBELLULE"' }; 
        case 10:
          return { question: 'Moi j adore ca le jus d orange', answer: 'C est bien éléonore on est content' }; 
        case 13:
          return { question: `Enzo je coupe la vidéo`, answer: 'J t encule' };
        case 16:
          return { question: `Mon sac est  `, answer: 'Fait' };
        case 19:
          return { question: 'Il est lent ce', answer: 'Lait' }; 
        //2ème columne Medium
        case 2:
           return { question: "What color is your ?", answer: 'Bugatti' };
        case 5:
          return { question: `Etiènne le bolideur, fan de ?`, answer: 'Bolidage' };
        case 8:
          return { question: `La gadji elle est trop soulex `, answer: 'La gadji elle est trop flax' };
        case 11:
          return { question: `Grigny la grande borne -?`, answer: 'Une bite sur l épaule (si toute la chanson distribue 2 shoots)' };
        case 14:
          return { question: 'Tu as mis le ', answer: 'Kimonon' }; 
        case 17:
          return { question: `Y a que moi qui la touche `, answer: 'Y a que moi qui la kayakobeme' };
        case 20:
          return { question: `C est pas comme ca qu on `, answer: 'imagine la vie' };
        //3ème columne Hard
        case 3:
          return { question: `La rue la vrai que de la fumée ya ya`, answer: 'Tu vois c est pour ca t as pas de meuf ' };
        case 6:
          return { question: 'Quoicou -?', answer: 'Baka' }; 
        case 9:
          return { question: `Bébou est que tu m'aimes ? Est ce que tu me ? `, answer: "Gnoni" };
        case 12:
          return { question: `Vous aussi vous attendez l ouverture de fitness park`, answer: 'Non moi je suis coach' };
        case 15:
          return { question: `Attention je suis peut etre attiré `, answer: 'par les mineurs' };
        case 18:
          return { question: `Why giroud is the best player`, answer: 'Yes is a giroud' };
        case 21:
          return { question: `Je Roucoule`, answer: 'Je brois la langue de molière' };
        // Add more cases as needed
        default:
          return { question: 'Default Question', answer: 'Default Answer' };
      }
  };
         
     
 //Create the constant with the curent question and answer 
  const { question, answer } = selectedCard ? getCardTexts(selectedCard) : { question: '', answer: '' };
 
  return (
    <div className={`${styles['centered-cell']} ${styles['background-image']}`}>
      <NavigationBar/>
      <h1>Welcome to trivia 3 </h1>
      <table className={styles['centered-table']}>
        <thead>
          <tr>
            <th className={styles["space-columns"]}>Easy</th>
            <th className={styles["space-columns"]}>Medium</th>
            <th className={styles["space-columns"]}>Hard</th>
          </tr>
        </thead>
        <tbody>
        
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <tr key={rowIndex}>
            {Array.from({ length: 3 }, (_, colIndex) => {
              const buttonNumber = (colIndex + rowIndex * 3) + 1;
              const isButtonClicked = clickedButtons.includes(buttonNumber);

              return (
                  <td key={colIndex} className={styles['centered-cell']}>
                  <button
                  key={rowIndex}
                  onClick={() => showCard(buttonNumber)}
                  className={isButtonClicked ? styles['red-button'] : ''}
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

      <div className={styles['card-container']}>
      {selectedCard && (
        <div>
        <div className={`${styles['centered-cell']} ${styles['card']}`}>
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
