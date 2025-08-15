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
    1: "https://www.youtube.com/embed/8GJuZy79J1k", //done

    2: "https://www.youtube.com/embed/5_89xbnKYaM", //done
    3: "https://www.youtube.com/embed/mV_dgau3VPE", //done


    4: "https://www.youtube.com/embed/uD-Yl7xbw7M", //done

    5: "https://www.youtube.com/embed/-Wfdwh_NGPE", //check potential issue
    6: "https://www.youtube.com/embed/sWPlVX37JmU", //done

    7: "https://www.youtube.com/embed/dUzYKDgPzjg",//done

    8: "https://www.youtube.com/embed/baABN1MreSE", //done
    9: "https://www.youtube.com/embed/R5PHHx9BZv8", //done

    10: "https://www.youtube.com/embed/q5H8PPJSBPM",//done

    11: "https://www.youtube.com/embed/tM1901OjeeI", //done pb de video
    12: "https://www.youtube.com/embed/1P7LFLzukg8", //done
    
    13: "https://www.tiktok.com/@brutofficiel/video/7088344094459612422?lang=fr", //done
    
    14: "https://www.youtube.com/embed/DVveTEgixwU", //done
    15: "https://www.tiktok.com/@akamztwenty20/video/6868313221258824965?lang=fr", //done
    
    16: "https://www.youtube.com/embed/6elK8VI1rPs", //done
    
    17: "https://www.youtube.com/embed/llmLO4it61M", //done 
    18: "https://www.youtube.com/embed/UTpOcdrxZBE", //done 
    
    19: "https://www.youtube.com/embed/FrJHQB1W41E",//done
    
    20: "https://www.youtube.com/embed/xp255HOiim8", //done
    21: "https://www.youtube.com/embed/bnNFpnSExSU", //done
    // Add more mappings as needed
  };

  const imageUrls = {
    1: "/images/memes/game2/panneau.png", //done
    2: "/images/memes/game2/decollete.png",//done
    3: "/images/memes/game2/quick.png", //done
    4: "/images/memes/game2/bzez.png", //done
    5: "/images/memes/game2/mamadou.png", //done
    6: "/images/memes/game2/sida.png", //done
    7: "/images/memes/game2/souffrir.png", //done
    8: "/images/memes/game2/princesse.png", //done
    9: "/images/memes/game2/bougnoul.png", //done
    10: "/images/memes/game2/wallah.png", //done
    11: "/images/memes/game2/etranger.png", //done
    12: "/images/memes/game2/raciste.png", //done
    13: "/images/memes/game2/partout.png", //done
    14: "/images/memes/game2/charbon.png", //done
    15: "/images/memes/game2/naruto.png", //done
    16: "/images/memes/game2/encore.png", //done
    17: "/images/memes/game2/cousine.png", //done
    18: "/images/memes/game2/mefiez.png", //done
    19: "/images/memes/game2/delinquant.png", //done
    20: "/images/memes/game2/bon.png", //done
    21: "/images/memes/game2/glace.png", //done
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
          return { question: `Y a pas de ... `, answer: '' };
        case 4: 
          return { question: 'Pas mal les ... ', answer: '' }; 
        case 7:
          return { question: 'J suis pas venu ici pour ..', answer: '' }; 
        case 10:
          return { question: 'Dis pas ... t es ...', answer: '' }; 
        case 13:
          return { question: `Ils sont partout ... `, answer: '' };
        case 16:
          return { question: `Encore ... `, answer: '' };
        case 19:
          return { question: 'T es un ...', answer: '' }; 
        //2ème columne Medium
        case 2:
           return { question: "J ai fait pété ...", answer: '' }; 
        case 5:
          return { question: `Mamadou ? ...`, answer: '' };
        case 8:
          return { question: `Bonjour princesse ..`, answer: '' };
        case 11:
          return { question: `Animal qui vit parmis nous ?`, answer: '' };
        case 14:
          return { question: 'Le charbon ...', answer: '' }; 
        case 17:
          return { question: `Ta cousine j la ... meme moi ...`, answer: '' };
        case 20:
          return { question: `Est ce que c est ...`, answer: '' };
        //3ème columne Hard
        case 3:
          return { question: `On va a ...`, answer: '' };
        case 6:
          return { question: '12 minutes ca fait déjà longtemps ... ', answer: '' }; 
        case 9:
          return { question: `D accord ... `, answer: "" };
        case 12:
          return { question: `Oui j suis ...`, answer: '' };
        case 15:
          return { question: `Narutooooooo ...`, answer: '' };
        case 18:
          return { question: `si vous vous retrouvez face a un terroriste ....`, answer: '' };
        case 21:
          return { question: `Coucou les musulmans ...`, answer: '' };
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
      <h1>Welcome to Memes culture 2 </h1>
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
              const buttonNumber = (colIndex + rowIndex * 3) + 1;
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
