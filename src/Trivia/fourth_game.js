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
        
        //1ère colomne  Jeux videos 
        case 1:
          return { question: 'Dans ce jeux le joueur est un cercle jaune qui avale des cercles blancs et est chassé par des phantomes', answer: "Miss Pacman" };
        case 9: 
          return { question: `Ce MOBA est connu pour être un anti antidépressant`, answer: 'Leauge of Legends' };
        case 17:
          return { question: `Réarranges ces lettres pour faire un titre de jeux video "GSOC"`, answer: 'Counter Strike Global Offensive' };
        case 25:
          return { question: 'Missing', answer: 'Missing' };
        case 33:
          return { question: `Qui est le personnage principal de Mario Bros 2`, answer: 'Mario' };
        
        
        //2ème columne (Astronomy)
        case 2:
          return { question: 'Quel est le vrai nom de la Lune', answer: 'la Lune' };
        case 10:
          return { question: `Quel est mon signe astrologique ?`, answer: 'Bélier' };
        case 18:
          return { question: 'Sur une échelle de 1 à 10 quelle taille fait l univers', answer: "7" };
        case 26:
          return { question: `Tu es dans une voiture qui va a 80,5km/h tu croises une voiture allant dans la même vitesse dans le sens opposé, à quelle vitesse semble la voiture aller ?`, answer: '100mph' };
        case 34:
          return { question: "Explique l'utilité d'une simulation de monte carlo sur la détermination du prix d'une option ?", answer: 'Simule le prix de l underlying pour tous les chemins possible et calcule les bénéfices de l option dans chaque situation.' };  
         
        
        //3ème columne (Comouter Science)
        case 3:
          return { question: `if x=23 and x=x+7 quelle est la valeur de x`, answer: '30' };
        case 11:
          return { question: "Est ce que les ordinateurs sont de bons nageurs ?", answer: 'Non' };  
        case 19:
          return { question: `Que fait cette ligne de code: //function(element){get.id(element)} `, answer: 'Rien c est un commentaire' };
        case 27:
          return { question: 'Qu est ce que ca dit: 01010011 01110101 01100011 01100101 00100000 01101101 01100001 00100000 01100010 01101001 01110100 01100101 (vous pouvez utiliser internet)', answer: 'Suce ma bite' };  
        case 35:
          return { question: `Si ta mère ne te voulait pas et que ton père t'apprécie quel est le résultat ?`, answer: 'Sasha' };
        

        //4ème columne (Gambling)
        case 4:
          return { question: 'Distribues 4 gorgées', answer: 'vraiment' };   
        case 12:
          return { question: `Distribues 6 grogées`, answer: 'Sérieusement' };
        case 20:
          return { question: 'Distribues 8 gorgées', answer: 'Oui' };  
        case 28:
          return { question: `Distribues 10 gorgées`, answer: 'Evidemment' };
        case 36:
          return { question: 'Prends 4 gorgées', answer: 'Oui' };  
        case 40:
           return { question: 'Prends 6 gorgées', answer: 'Oui' };  
        case 40:
          return { question: 'Prends 8 gorgées', answer: 'Oui' };  
        case 40:
          return { question: 'Distribues 1 shot', answer: 'Oui' }; 
       

        //5ème columne (Health)
        case 5:
          return { question: `Les docteurs recommendent de le faire toutes les 3 secondes ?`, answer: 'respirer' };
        case 13:
          return { question: `Est ce que l'eau est bien pour enlever le sang d un tapis ?`, answer: 'Bof' };
        case 21:
          return { question: 'Paul se bat avec 3 docteurs combien de pommes doit il manger pour gagner ?', answer: '3' };  
        case 29:
          return { question: `Une personne se retrouve avec la tête détaché mais ne meurt pas, pourquoi ?`, answer: 'Il était déjà mort' };
          // Add picture
        case 37:
          return { question: 'Missing', answer: 'Missing' };  
        case 37:
          return { question: 'Quels sont les 3 macronutriments', answer: 'glucides, lipides, protéines' };  
        case 37:
          return { question: 'Que fais tu quand tu es appelé pour testifier de ta participation dans un meurte', answer: 'Ne dis rien et appelles un avocat' }; 
        

           //5ème columne (Shrek)
        case 6:
            return { question: `Est ce que tu penses que je suis schizophrène ?`, answer: 'Je ne te parlais pas prends 3 gorgées.' };
          case 14:
            return { question: `Ce filme est une suite de shrek`, answer: 'Shrek 3' };
          case 22:
            return { question: 'Est ce que le raisin est un fruit', answer: 'Non' };  
          case 30:
            return { question: `Qui est le personnage principal du premier jeux Donkey Kong`, answer: 'Donkey Kong' };
          case 38:
            return { question: 'Cette personne est mauvaise au lit', answer: 'Paul' };  
        case 38:
            return { question: 'Pierre, papier, ciseaux', answer: 'Je choisis ciseaux' };  
        case 38:
            return { question: 'Quel est l animé préférée de Paul', answer: 'That time I got reincarnated as a slime' };
        case 38:
            return { question: 'Pourquoi les planetes du cercle extérieur sont toutes gazeuse ?', answer: 'Temperature du soleil trop chaude pour avoir des planetes gazeuse proches' };
          
        

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
        🎓 Welcome to Trivia 2
      </h1>
      <table className={styles['centered-table']}>
      <thead>
        <tr>
          <th className={styles["space-columns"]}>🗺️ Jeux videos</th>
          <th className={styles["space-columns"]}>💰 Astronomy</th>
          <th className={styles["space-columns"]}>🧮 Computer Science</th>
          <th className={styles["space-columns"]}>🧲 Gambling</th>
          <th className={styles["space-columns"]}>🚀 Health</th>
          <th className={styles["space-columns"]}>🎮 Shrek</th>
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
    <div className={stylesCard['scroll']}>
      {question40 && <img src='/images/trivia/code.png'></img>}
      {question37 && <img src='/images/trivia/equationsaha.png'></img>}
      {question9 && <img src='/images/trivia/corée.png'></img>}
    </div>
      
    </div>
  );
};

export default Trivia;
