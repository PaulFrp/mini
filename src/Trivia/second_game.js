import React, { useState } from 'react';
import Card from './card'; // Import the Card component
import styles from './card.module.css'; // Correct import statement
import NavigationBar from '../navBar';


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
          return { question: "Qule taille faisait Napoléon ?", answer: '1m68' };
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
          return { question: 'Quel est le nom du dragon de hagrid dans harry potter ?', answer: 'Norbert' };  
        
        //3ème columne (meme culture 2)
        case 3:
          return { question: `Le premier savant de toute la république démocratique du Congo ? `, answer: 'EDDY MALOU' };
        case 8:
          return { question: "What color is your ?", answer: 'Bugatti' };  
        case 13:
          return { question: `La gadji elle est trop soulex `, answer: 'La gadji elle est trop flax' };
        case 18:
          return { question: 'Quoicou -?', answer: 'Baka' };  
        case 23:
          return { question: `Enzo je coupe la vidéo`, answer: 'J t encule' };
        case 28:
          return { question: 'Tu crois que c est du respect ? ', answer: 'Tu crois que c est du respect mon garcon ? ' }; 
        case 33:
          return { question: `Etiènne le bolideur, fan de ?`, answer: 'Bolidage' };

        //4ème columne (meme culture)
        case 4:
          return { question: '8 morts 6 blessés ?', answer: 'Je pète ma bière, MA "LUBELLULE"' };   
        case 9:
          return { question: `Grigny la grande borne -?`, answer: 'Une bite sur l épaule (si toute la chanson distribue 2 shoots)' };
        case 14:
          return { question: 'Tu as mis le ', answer: 'Kimonon' };  
        case 19:
          return { question: `La rue la vrai que de la fumée ya ya`, answer: 'Tu vois c est pour ca t as pas de meuf ' };
        case 24:
          return { question: 'Moi j adore ca le jus d orange', answer: 'C est bien éléonore on est content' };  
        case 29:
          return { question: `Bébou est que tu m'aimes ? Est ce que tu me ? `, answer: "Gnoni" };
        case 34:
          return { question: 'Il est lent ce', answer: 'Lait' }; 

        //5ème columne (compléter)
        case 5:
          return { question: `Nig-`, answer: 'Nigeria' };
        case 10:
          return { question: `je te ba- quand tu veux`, answer: 'je te bats quand tu veux' };
        case 15:
          return { question: 'va te faire foutre sale clo-', answer: 'clo- porte' };  
        case 20:
          return { question: `une conn-`, answer: 'une conn- ection ' };
        case 25:
          return { question: 'J ai une trèèèèès grande bi-', answer: 'bi- bliothèque' };  
        case 30:
          return { question: "Je prends ma bi- pour rentrer dans ton a-", answer: "Je prends ma bi-cyclette pour rentrer dans ton a-ppartement" };
        case 35:
          return { question: "Grosse me-", answer: 'Grosse me- rde' };
        

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
    <div className={`${styles['centered-cell']} ${styles['background-image']}`}>
    <NavigationBar/>
      <h1>Welcome to trivia </h1>
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
        <div className={`${styles['centered-cell']} ${styles['card']}`}>
          <Card question={question} answer={answer} isFlipped={isFlipped} handleCardClick={handleCardClick} />
        </div>
      )}
    </div>

       
    </div>
  );
};

export default Trivia;
