import React, { useState, useEffect } from 'react';
import Card from './card'; // Import the Card component
import stylesCard from './card.module.css'; // Correct import statement
import NavigationBar from '../navBar';
import styles from "./Memes.module.css"; 


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
    2: "https://www.youtube.com/embed/jUXGN-ffKlk",
    3: "https://www.youtube.com/embed/lR-jr2ZmSgM",
    4: "https://www.youtube.com/embed/NP9NI8xX9nY",
    5: "https://www.youtube.com/embed/5V2D1aXX_UM",
    6: "https://www.youtube.com/embed/j_nBgTFbXb4",
    7: "https://www.youtube.com/embed/UJ3TOP3bBN0",
    8: "https://www.youtube.com/embed/PNHYCZJWbGY",
    9: "https://www.youtube.com/embed/1ABOGlSXV9k",
    10: "https://www.youtube.com/embed/L9e8tGd11vQ",
    11: "https://www.youtube.com/embed/Ho8xZ5VN9oM",
    12: "https://www.youtube.com/embed/EsROdUJOWWc",
    13: "https://www.youtube.com/embed/dVVGBP6lPRM",
    14: "https://www.youtube.com/embed/YSti80flxfA",
    15: "https://www.youtube.com/embed/tyykNPc1r4U",
    16: "https://www.youtube.com/embed/eFUc7ln2PKI",
    17: "https://www.tiktok.com/@bestclip.editz/video/7415118143070194977?lang=fr", //Need to find vid 
    18: "https://www.youtube.com/embed/4w6REQGQ89E",
    19: "https://www.youtube.com/embed/dI7kaN2fZ4g",
    20: "https://www.youtube.com/embed/iSXja9pRfQ0",
    21: "https://www.youtube.com/embed/9NECnxp_m6k",
    // Add more mappings as needed
  };

  const imageUrls = {
    1: "/images/memes/game1/eddy_malou.jfif",
    2: "/images/memes/game1/bugatti.png",
    3: "/images/memes/game1/la_rue.png",
    4: "/images/memes/game1/respect.jfif",
    5: "/images/memes/game1/bolideur.jfif",
    6: "/images/memes/game1/étoile.jfif",
    7: "/images/memes/game1/8_morts.jfif",
    8: "/images/memes/game1/flax.jpg",
    9: "/images/memes/game1/gnoni.png",
    10: "/images/memes/game1/eleonore.jfif",
    11: "/images/memes/game1/grigny.jfif",
    12: "/images/memes/game1/coach.jfif",
    13: "/images/memes/game1/attiré.jfif",
    14: "/images/memes/game1/kimono.jfif",
    15: "/images/memes/game1/enzo.png",
    16: "/images/memes/game1/mon_sac_fait.jfif",
    17: "/images/memes/game1/kayakobeme.jfif",
    18: "/images/memes/game1/giroud.jfif",
    19: "/images/memes/game1/ce_lait.png",
    20: "/images/memes/game1/la_vie.jpg",
    21: "/images/memes/game1/roucoule.jfif",
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
          return { question: `Le premier savant de toute la république démocratique du Congo ? `, answer: '' };
        case 4: 
          return { question: 'Tu crois que c est du respect ? ', answer: '' }; 
        case 7:
          return { question: '8 morts 6 blessés ?', answer: '' }; 
        case 10:
          return { question: 'Moi j adore ca le jus d orange', answer: '' }; 
        case 13:
          return { question: `Attention je suis peut etre attiré `, answer: '' };
        case 16:
          return { question: `Mon sac est  `, answer: '' };
        case 19:
          return { question: 'Il est lent ce', answer: '' }; 
        //2ème columne Medium
        case 2:
           return { question: "What color is your ?", answer: '' };
        case 5:
          return { question: `Etiènne le bolideur, fan de ?`, answer: '' };
        case 8:
          return { question: `La gadji elle est trop soulex `, answer: '' };
        case 11:
          return { question: `Grigny la grande borne -?`, answer: '' };
        case 14:
          return { question: 'Tu as mis le ', answer: '' }; 
        case 17:
          return { question: `Y a que moi qui la touche `, answer: '' };
        case 20:
          return { question: `C est pas comme ca qu on `, answer: '' };
        //3ème columne Hard
        case 3:
          return { question: `La rue la vrai que de la fumée ya ya`, answer: '' };
        case 6:
          return { question: 'faites ? sur le clavier', answer: '' }; 
        case 9:
          return { question: `Bébou est que tu m'aimes ? Est ce que tu me ? `, answer: "" };
        case 12:
          return { question: `Vous aussi vous attendez l ouverture de fitness park`, answer: '' };
        case 15:
          return { question: `Enzo je coupe la vidéo`, answer: '' };
        case 18:
          return { question: `Why giroud is the best player`, answer: '' };
        case 21:
          return { question: `Je Roucoule`, answer: '' };
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
      <h1>Welcome to Memes culture </h1>
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
