import React, { useState } from 'react';
import Card from './card'; // Import the Card component
import stylesCard from './card.module.css'; // Correct import statement
import NavigationBar from '../navBar';
import styles from "./Trivia.module.css";


const Trivia = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [clickedButtons, setClickedButtons] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);

  const showCard = (number) => {
    setSelectedCard(number);
    setClickedButtons((prevClickedButtons) => [...prevClickedButtons, number]);
    setIsFlipped(false)
    
  };

  const handleCardClick = () => {
    if(!isFlipped){
        setIsFlipped(true)
    }else{
        setIsFlipped(false)
    }
  };

  const getCardTexts = (number) => {
    
    switch (number) {
        
        //1ère colomne 
        case 1:
          return { question: 'Quel animal peut sauter plus haut que la Tour Eiffel ?', answer: "La tour eiffel ne saute pas..." };
        case 6:
          return { question: `C'est un carré jaune avec des trous qui vit dans un truc jaune sous l'eau ou qql chose comme ca`, answer: 'Bob l éponge' };
        case 11:
          return { question: `Pourquoi les plongeurs tombent du bateau en arrière ?`, answer: 'Parce que en avant ils tombent dans le bateau' };
        case 16:
          return { question: 'Quel est le meilleur moyen de plier un t shirt ?', answer: 'le plier' };
        case 21:
          return { question: `Quel est l animal préféré de paul`, answer: 'La chatte' };
        case 26:
          return { question: "Quelle taille faisait Napoléon ?", answer: '1m68' };
        case 31:
          return { question: `Qui vit dans un ananas sous la mer ?`, answer: 'Personne peut vivre sous la mer encore moins dans un ananas' };
        
        //2ème columne (danger)
        case 2:
          return { question: 'Tout le monde prend 5 gorgés', answer: 'Ta gueule' };
        case 7:
          return { question: `Qui est mort le 22 mars 2003`, answer: 'L avenir de sasha' };
        case 12:
          return { question: 'Pile ou face', answer: "Pile tu prends un shoot, face tu prends un shoot" };
        case 17:
          return { question: `La plus grande qualité de Paul ?`, answer: 'Toutes ses qualités sont incroyables dur de faire le choix' };
        case 22:
          return { question: "Roi blanc g1, tour blanche e1, black king g8, black bishop f4. Move to win ?", answer: 'Rxe8#' };  
        case 27:
          return { question: `Le plus grand défaut de ce jeux ?`, answer: 'On boit pas assez tous un shoot' };
        case 32:
          return { question: 'Combien y a t il de lettres dans l alphabet ?', answer: 'Toutes' };  
        
        //3ème columne Fiction
        case 3:
          return { question: `Des enfants de 10 ans qui forcent des esclaves a se battre`, answer: 'Digimon' }; // change
        case 8:
          return { question: "Tu as un date ce soir, qu est ce que tu fais ?", answer: 'Tu bois, personne ne veut de toi c était ton imagination' };  
        case 13:
          return { question: `Quelle serait la première phrase Paul en arrivant sur la Lune ? `, answer: 'Y a pas de bar j me casse' };
        case 18:
          return { question: 'Missing', answer: 'Missing' };  
        case 23:
          return { question: `Missing`, answer: 'Missing' };
        case 28:
          return { question: 'Missing', answer: 'Missing' }; 
        case 33:
          return { question: `Quel est le nom du dragon de hagrid dans harry potter ?`, answer: 'Norbert' };

        //4ème columne (Alcool)
        case 4:
          return { question: 'Missing', answer: 'Missing' };   
        case 9:
          return { question: `Missing`, answer: 'Missing' };
        case 14:
          return { question: 'Missing', answer: 'Missing' };  
        case 19:
          return { question: `Missing`, answer: 'Missing' };
        case 24:
          return { question: 'Missing', answer: 'Missing' };  
        case 29:
          return { question: `Missing`, answer: "Missing" };
        case 34:
          return { question: 'Missing', answer: 'Missing' }; 

        //5ème columne (compléter)
        case 5:
          return { question: `Missing`, answer: 'Missing' };
        case 10:
          return { question: `Missing`, answer: 'Missing' };
        case 15:
          return { question: 'Missing', answer: 'Missing' };  
        case 20:
          return { question: `Missing`, answer: 'Missing' };
        case 25:
          return { question: 'Missing', answer: 'Missing' };  
        case 30:
          return { question: "Missing", answer: "Missing" };
        case 35:
          return { question: "Missing", answer: 'Missing' };
        

        // Add more cases as needed
        default:
          return { question: 'Default Question', answer: 'Default Answer' };
      }
  };


  // Create a 7x5 grid of buttons
  const buttons = [];
  for (let row = 1; row <= 7; row++) {
    for (let col = 1; col <= 5; col++) {
       // Calculate a unique number for each button
      buttons.push(
        <button key={row} onClick={() => showCard(col + (row - 1) * 5)}>
          {row}
        </button>
      );
    }
  }

  const { question, answer } = selectedCard ? getCardTexts(selectedCard) : { question: '', answer: '' };
 
  return (
    <div className={`${styles['centered-cell']} ${stylesCard['background-image']}`}>
    <NavigationBar/>
      <h1>Welcome to trivia 2 </h1>
      <table className={styles['centered-table']}>
      <thead>
          <tr>
            <th className={styles["space-columns"]}>Random</th>
            <th className={styles["space-columns"]}>Danger !</th>
            <th className={styles["space-columns"]}>Meme culture 1</th>
            <th className={styles["space-columns"]}>Meme culture 2</th>
            <th className={styles["space-columns"]}>Compléter</th>
          </tr>
        </thead>
        <tbody>
        
          {Array.from({ length: 7 }, (_, rowIndex) => (
            <tr key={rowIndex}>
            {Array.from({ length: 5 }, (_, colIndex) => {
              const buttonNumber = (colIndex + rowIndex * 5) + 1;
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
        <div className={`${stylesCard['centered-cell']} ${stylesCard['card']}`}>
          <Card question={question} answer={answer} isFlipped={isFlipped} handleCardClick={handleCardClick} />
        </div>
      )}
    </div>

       
    </div>
  );
};

export default Trivia;
