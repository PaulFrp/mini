import React, { useState, useEffect } from 'react';
import Card from './card'; // Import the Card component
import stylesCard from './card.module.css'; // Correct import statement
import NavigationBar from '../navBar';
import styles from "./Trivia.module.css";

const Trivia = () => {

  //Create relevant variables 
  const [selectedCard, setSelectedCard] = useState(null);
  const [clickedButtons, setClickedButtons] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);

  //Get the card number, add the number that was clicked to the array of clicked buttons and set the card to the question side
  const showCard = (number) => {
    setSelectedCard(number);
    setClickedButtons((prevClickedButtons) => [...prevClickedButtons, number]);
    setIsFlipped(false)
  };

  //Turn the card around when flipped
  const handleCardClick = () => {
    if(!isFlipped){
        setIsFlipped(true)
    }else{
        setIsFlipped(false)
    }
  };




  //Questions and answers for the trivia 
  const getCardTexts = (number) => {
    console.log(number);
    switch (number) {
        
        //1ère colomne  géographie 
        case 1:
          return { question: 'Est ce que Lyon est considéré comme le Sud ?', answer: "Oui" };
        case 9: 
          return { question: `Mont Saint michel, Normandie ou Bretagne ?`, answer: 'Battez-vous, mais en vrai Normandie' };
        case 17:
          return { question: `Si tu vas 24 900 MILES à l'est du brésil ou arrives-tu ?`, answer: 'Brésil' };
        case 25:
          return { question: 'Pourquoi il y a des marées en Normandie mais pas méditerranée ?', answer: 'L énorme daronne de Sash ne se baigne pas en méditerranée donc elle ne fait pas monter le niveau de l eau' };
        case 33:
          return { question: `Ce pays est connu pour être une soupe avec de la viande, de la tomate etc...`, answer: 'Chilie' };
        
        
        //2ème columne (Economie)
        case 2:
          return { question: 'Est ce que le porteufeuille de Paul a gagné ou perdu ajd ? Faites des paris', answer: 'Ceux qui ont raison distribuent une gorgée chacun' };
        case 10:
          return { question: `Tout le monde joue, comme à la roulette (rouge ou noir). Pariez un nombre de gorgées`, answer: 'Rouge (si bonne réponse distribue les gorgées parié si noir bois les' };
        case 18:
          return { question: 'Quels pourcentage de la gen Z cherche des conseils financiers sur tik tok ?', answer: "34%... On est FOUTU" };
        case 26:
          return { question: `Qu'est ce qu'un ETF`, answer: 'Un NFT à une lettre près' };
        case 34:
          return { question: "Est ce que le pizza index a prévu l opération midnight hammer ?", answer: 'Oui, comme d habitude' };  
         
        
        //3ème columne (Math)
        case 3:
          return { question: `Qu'est ce que 1+3 ?`, answer: 'Prends 4 gorgées' };
        case 11:
          return { question: "Missing", answer: 'Missing' };  
        case 19:
          return { question: `Missing`, answer: 'Missing' };
        case 27:
          return { question: 'Tu es dans une voiture qui va a 80,5km/h tu croises une voiture allant dans la même vitesse dans le sens opposé, à quelle vitesse semble la voiture aller ?', answer: '100mph' };  
        case 35:
          return { question: `Missing`, answer: 'Missing' };
        

        //4ème columne (Physique)
        case 4:
          return { question: 'J ai pas trouvé de question', answer: 'Tous une gorgée du coup' };   
        case 12:
          return { question: `Combien de temps prend la lumière à voyager une année lumière ?`, answer: '1 an' };
        case 20:
          return { question: 'Missing', answer: 'Missing' };  
        case 28:
          return { question: `Combien de protons y a-t-il dans le carbon ?`, answer: '6' };
        case 36:
          return { question: 'Missing', answer: 'Missing' };  
       

        //5ème columne (Espace)
        case 5:
          return { question: `Cette créature est connu pour voler`, answer: 'Une mouche' };
        case 13:
          return { question: `Quelle taille fait l espace ? (Grand, Très grand, Truc de fou comment c'est trop grand wesh, incroyable et impossiblement grand )`, answer: 'Très grand.' };
        case 21:
          return { question: 'Combien de temps dans une année lumière ?', answer: 'Aucun c est une distance' };  
        case 29:
          return { question: `Missing`, answer: 'Missing ' };
          // Add picture
        case 37:
          return { question: 'Missing', answer: 'Missing' };  
        

           //5ème columne (jeux vidéo)
        case 6:
            return { question: `C'est un plombier moustachue qui part sauver une princesse à travers le royaume champignon`, answer: 'Luigi' };
          case 14:
            return { question: `Comment avoir une vie supplémentaire ?`, answer: 'haut, haut, bas, bas, gauche, droite, gauche, droite, B, A' };
          case 22:
            return { question: 'Quel est la réponse à la question Jeux vidéo 2 ?', answer: 'haut, haut, bas, bas, gauche, droite, gauche, droite, B, A' };  
          case 30:
            return { question: `Quel est la signification de word.exe ?`, answer: 'Scandale de triche le plus connu de CS' };
          case 38:
            return { question: 'Missing', answer: 'Missing' };  
          

             //5ème columne (Cailloux et trucs)
        case 7:
            return { question: `C est une des attractions les plus connus aux US, les gens y vont parcequ-il n-y a rien`, answer: 'Le grand canyon' };
          case 15:
            return { question: `C'est un animal à 4 pattes qui est souvent connu pour avoir une corne sur sa tête ?`, answer: 'Rhino' };
          case 23:
            return { question: 'Si le mont everest fait la taille des chiffres de ta carte de crédit et que la tour eiffel fait la taille des 3 chiffres de derrière quelle taille font ils respectivement ?', answer: 'Si t as répondu t es sacrément con' };  
          case 31:
            return { question: `A quel point Paul est intelligent ?`, answer: 'Il est plutot con...' };
          case 39:
            return { question: 'La réponse à cette question est A ( A.)B B.)B C.)F D.)D E.)C F.)A )', answer: 'E.)C' };  
         

              //5ème columne (Ordinateur)
        case 8:
            return { question: `Missing`, answer: 'Missing' };
          case 16:
            return { question: `taco cat à l'envers ?`, answer: 'cat taco' };
          case 24:
            return { question: 'Missing', answer: 'Missing' };  
          case 32:
            return { question: `let x = 50 if(x=10){console.log("Nique ta mère")} else {x-5}`, answer: 'manque un signe =' };
          case 40:
            return { question: 'Qu est ce qu un 1.58 bit pour un LLM ?', answer: 'Un bit qui prend -1,0,1 donc comme la daronne de cléa (Non Binaire)' };  
        
        

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
      <h1 style={{ textAlign: 'center', marginTop: '20px', fontSize: '2rem' }}>
        🎓 Welcome to Trivia 3
      </h1>
      <table className={styles['centered-table']}>
      <thead>
        <tr>
          <th className={styles["space-columns"]}>🗺️ Géographie</th>
          <th className={styles["space-columns"]}>💰 Économie</th>
          <th className={styles["space-columns"]}>🧮 Math</th>
          <th className={styles["space-columns"]}>🧲 Physics</th>
          <th className={styles["space-columns"]}>🚀 L'espace</th>
          <th className={styles["space-columns"]}>🎮 Jeux vidéo</th>
          <th className={styles["space-columns"]}>🪨 Cailloux et trucs</th>
          <th className={styles["space-columns"]}>💻 Ordinateur</th>
        </tr>
      </thead>
        <tbody>
        
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <tr key={rowIndex}>
            {Array.from({ length: 8 }, (_, colIndex) => {
              const buttonNumber = (colIndex + rowIndex * 8) + 1;
              const isButtonClicked = clickedButtons.includes(buttonNumber);

              return (
                  <td key={colIndex} className={styles['centered-cell']}>
                  <button
                    onClick={() => showCard(buttonNumber)}
                    className={`${styles.triviaButton} ${isButtonClicked ? styles['red-button'] : ''}`}
                  >
                  {rowIndex + 1}
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
