import React, { useState, useEffect } from 'react';
import Card from './card'; // Import the Card component
import styles from './card.module.css'; // Correct import statement
import NavigationBar from '../navBar';


const Trivia = () => {

  //Create relevant variables 
  const [selectedCard, setSelectedCard] = useState(null);
  const [clickedButtons, setClickedButtons] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const[question40, setQuestion40] = useState(false)
  const[question9, setQuestion9] = useState(false)
  const[question37, setQuestion37] = useState(false)

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

  //Handle pictures display depending on the question need (executes every time a new card is selected)
  useEffect(() => {
    if (selectedCard === 9) {
      setQuestion9(true)
      setQuestion37(false)
      setQuestion40(false)
    }else if (selectedCard === 37) {
        setQuestion37(true)
        setQuestion9(false)
        setQuestion40(false)
    }else if (selectedCard === 40) {
        setQuestion40(true)
        setQuestion9(false)
        setQuestion37(false)
    }else{
        setQuestion9(false)
        setQuestion37(false)
        setQuestion40(false)
    }
  }, [selectedCard]);


  //Questions and answers for the trivia 
  const getCardTexts = (number) => {
    console.log(number);
    switch (number) {
        
        //1ère colomne  géographie 
        case 1:
          return { question: 'Donne le nom de 4 régions francaise', answer: "Le groupe jugera" };
        case 9: 
          return { question: `Quel est ce pays ?`, answer: 'Corée du Nord' };
        case 17:
          return { question: `Si tu vas 24 900 MILES à l'est du brésil ou arrives-tu ?`, answer: 'Brésil' };
        case 25:
          return { question: 'A quelle point Paul est intelligent ?', answer: 'Il est plutot con' };
        case 33:
          return { question: `Ce pays est connu pour être une soupe avec de la viande, de la tomate etc...`, answer: 'Chilie' };
        
        
        //2ème columne (Economie)
        case 2:
          return { question: 'Choisi un joueur qui prendra autant de gorgées que de stratégies d investissement que tu peux citer', answer: '...' };
        case 10:
          return { question: `Tout le monde joue, comme à la roulette (rouge ou noir). Pariez un nombre de gorgées`, answer: 'Rouge (si bonne réponse distribue les gorgées parié sinon bois les' };
        case 18:
          return { question: 'Venez on imprime plus d argent comme ca y aura plus de pauvreté ?', answer: "Inflation goes BRRRRRRRRRRRRRRRRRRRRRRRR" };
        case 26:
          return { question: `Qu'est ce qu'un ETF`, answer: 'Le groupe jugera de la qualité de la réponse' };
        case 34:
          return { question: "Explique l'utilité d'une simulation de monte carlo sur la détermination du prix d'une option ?", answer: 'Simule le prix de l underlying pour tous les chemins possible et calcule les bénéfices de l option dans chaque situation.' };  
         
        
        //3ème columne (Math)
        case 3:
          return { question: `Qu'est ce que 1+3 ?`, answer: 'Prend 4 grogées' };
        case 11:
          return { question: "Les 6 premiers nombres de pi ?", answer: '3.14159' };  
        case 19:
          return { question: `e^(-ln(2)) `, answer: '1/2' };
        case 27:
          return { question: '172 * 13', answer: '2236' };  
        case 35:
          return { question: `Quelles sont les implications de P = NP`, answer: 'Révolution de l IA et des algortihms de résolution' };
        

        //4ème columne (Physique)
        case 4:
          return { question: 'J ai pas trouvé de question', answer: 'Tous une gorgée du coup' };   
        case 12:
          return { question: `Combien de temps prend la lumière à voyager une année lumière ?`, answer: '1 an' };
        case 20:
          return { question: 'Qu est ce que la vitesse maximal de l univers ?', answer: 'lumière' };  
        case 28:
          return { question: `Combien de protons y a-t-il dans le carbon ?`, answer: '6' };
        case 36:
          return { question: 'Pourquoi un cercle fait 360 degrès ?', answer: 'Ca vient à peu près du nombre de jours que la terre prend à faire une rotation autour du soleil' };  
       

        //5ème columne (Espace)
        case 5:
          return { question: `Cette créature est connu pour voler`, answer: 'Une mouche' };
        case 13:
          return { question: `Quelle taille fait l espace ? (Grand, Très grand, Truc de fou comment c'est trop grand wesh, incroyable et impossiblement grand )`, answer: 'Très grand.' };
        case 21:
          return { question: 'Combien de temps dans une année lumière ?', answer: 'Aucun c est une distance' };  
        case 29:
          return { question: `Quel est la première planète que les astronomes ont découvert ?`, answer: 'La terre' };
          // Add picture
        case 37:
          return { question: 'C est quoi ?', answer: 'Saha equation montre le changement d ionisation des éléments en fonction de la température et de la pression d une étoile' };  
        

           //5ème columne (jeux vidéo)
        case 6:
            return { question: `C'est un plombier moustachue qui part sauver une princesse à travers le royaume champignon`, answer: 'Luigi' };
          case 14:
            return { question: `Comment avoir une vie supplémentaire ?`, answer: 'haut, haut, bas, bas, gauche, droite, gauche, droite, B, A' };
          case 22:
            return { question: 'Quel est la réponse à la question Jeux vidéo 2 ?', answer: 'haut, haut, bas, bas, gauche, droite, gauche, droite, B, A' };  
          case 30:
            return { question: `On fait une game de tic tac toe`, answer: 'Perdant prend 2 grogées' };
            //Missing this one
          case 38:
            return { question: 'De quelle livre les auteurs de Minecraft se sont inspiré ?', answer: 'Mein Kampf' };  
          

             //5ème columne (Cailloux et trucs)
        case 7:
            return { question: `C est une des attractions les plus connus aux US, les gens y vont parcequ-il n-y a rien`, answer: 'Le grand canyon' };
          case 15:
            return { question: `C'est un animal à 4 pattes qui est souvent connu pour avoir une corne sur sa tête ?`, answer: 'Rhino' };
          case 23:
            return { question: 'Si le mont everest fait la taille des chiffres de ta carte de crédit et que la tour eiffel fait la taille des 3 chiffres de derrière quelle taille font ils respectivement ?', answer: 'Si t as répondu t es sacrément con' };  
          case 31:
            return { question: `Quelle est le plus gros cailloux sur terre ?`, answer: 'La terre' };
          case 39:
            return { question: 'La réponse à cette question est A ( A.)B B.)B C.)F D.)D E.)C F.)A )', answer: 'E.)C' };  
         

              //5ème columne (Ordinateur)
        case 8:
            return { question: `Remets ces lettres dans l'ordre "Logarithm"`, answer: 'Algorithm' };
          case 16:
            return { question: `taco cat à l'envers ?`, answer: 'cat taco' };
          case 24:
            return { question: 'Une question', answer: '42' };  
          case 32:
            return { question: `let x = 50 if(x=10){console.log("Nique ta mère")} else {x --}`, answer: 'manque un signe =' };
          case 40:
            return { question: 'Que fait ce code ?', answer: 'Le jeux de merde aux quel vous êtes entrain de jouer.' };  
        
        

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
            <th className={styles["space-columns"]}>Géographie</th>
            <th className={styles["space-columns"]}>Economie</th>
            <th className={styles["space-columns"]}>Math</th>
            <th className={styles["space-columns"]}>Physics</th>
            <th className={styles["space-columns"]}>L'espace</th>
            <th className={styles["space-columns"]}>Jeux vidéo</th>
            <th className={styles["space-columns"]}>Cailloux et trucs</th>
            <th className={styles["space-columns"]}>Ordinateur</th>
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
    <div className={styles['scroll']}>
      {question40 && <img src='/images/trivia/code.png'></img>}
      {question37 && <img src='/images/trivia/equationsaha.png'></img>}
      {question9 && <img src='/images/trivia/corée.png'></img>}
    </div>
      
    </div>
  );
};

export default Trivia;
