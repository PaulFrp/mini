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
        
        //1ère colomne  Jeux videos 
        case 1:
          return { question: 'Dans ce jeux le joueur est un cercle jaune qui avale des cercles blancs et est chassé par des phantomes', answer: "Miss Pacman" };
        case 7: 
          return { question: `De quelle livre les auteurs de Minecraft se sont inspiré ?`, answer: 'Mein Kampf' }; 
        case 13:
          return { question: `Réarranges ces lettres pour faire un titre de jeux video "GSOC"`, answer: 'Counter Strike Global Offensive' };
        case 19:
          return { question: 'C est un jeux connu pour avoir des pnjs chiants et des quetes répétitives et pas fun mais des graphismes incroyables', answer: 'La vie' };
        case 25:
          return { question: `Quelle est la série de jeux préférée de Paul`, answer: 'Monster Hunter' }; //change
        case 31:
          return { question: `Qu est ce qu un easter egg ?`, answer: 'C est un oeuf en chocolat' };
        case 37:
          return { question: `Is the cake a lie ?`, answer: 'Oui.' };
        case 43:
          return { question: `Quel a été la plus grande déception dans minecraft ?`, answer: 'Le portail de l aether' };
        
        
        //2ème columne (Astronomy)
        case 2:
          return { question: 'Quel est le vrai nom de la Lune ?', answer: 'La Lune' }; 
        case 8:
          return { question: `Quel est la première planète que les astronomes ont découvert ?`, answer: 'La Terre' }; 
        case 14:
          return { question: 'Qu est ce que le Big Bang ?', answer: "La bande de Gaza" };
        case 20:
          return { question: `Comment prouver que les aliens existent ?`, answer: 'Il faut leur demander' };
        case 26:
          return { question: "Quel est la plus petite montagne sur terre ? ", answer: 'Le calecon de Paul quand il se réveille' };
        case 32:
          return { question: `Qu est ce que le gang bang ?`, answer: 'L explosion qui a crée l univers... Wait' };
        case 38:
          return { question: `Combien de lune a la Terre ?`, answer: '7 si vous ouvrez vos chakras' };
        case 44:
          return { question: `Quel est un équivalent du mot planète ?`, answer: 'un aplati pas flou (un plat nette)' };  
         
        
        //3ème columne (Computer Science)
        case 3:
          return { question: `if x=23 and x=x+7 quelle est la valeur de x`, answer: '30' };
        case 9:
          return { question: "Est ce que les ordinateurs sont de bons nageurs ?", answer: 'Non' };  //change 
        case 15:
          return { question: `Remets ces lettres dans l'ordre "Logarithm"`, answer: 'Algorithm' }; 
        case 21:
          return { question: 'Qu est ce que ca dit: 01010011 01110101 01100011 01100101 00100000 01101101 01100001 00100000 01100010 01101001 01110100 01100101 (vous pouvez utiliser internet)', answer: 'Suce ma bite' };  
        case 27:
          return { question: `Une question ?`, answer: '42' }; 
        case 33:
          return { question: `Quel est le meilleur moyen de communiquer avec un ordinateur ?`, answer: 'La schizophrénie surement..' };
        case 39:
          return { question: `Comment Paul décrit la programmation à des gens qui n'y connaissent rien ?`, answer: 'Je demande à un ordinateur de faire qql chose et quand il le fait pas je pleurs' }; // change
        case 45:
          return { question: `Est ce que Paul sait programmer ?`, answer: 'J vous emmerde tous, mais vous avez raison.' }; // change
        

        //4ème columne Monkey
        case 4:
          return { question: 'Quel est la taille a partir de laquelle un humain est considéré comme nain ?', answer: '0.9999 Maïa' };   
        case 10:
          return { question: `A quel point est ce que Sasha est attirant physiquement`, answer: 'Le mec est obèse il a une attraction très forte ' };
        case 16:
          return { question: 'e^(-ln(2))', answer: '1/2' };  
        case 22:
          return { question: `Si ta mère ne te voulait pas et que ton père t'apprécie quel est le résultat ?`, answer: 'Sasha' };
        case 28:
          return { question: 'Qu est ce que VRP ?', answer: 'Un travail d avenir selon Max' };  
        case 34:
           return { question: 'Quelle taille fait la bite de Paul ?', answer: 'Tous ceux qui ont dit 14 une gorgée.' };  
        case 40:
          return { question: 'Les 11 premiers nombres de pi ? (autant de gorgées que de mauvais chiffres)', answer: '3,1415926535' };  
        case 46:
          return { question: 'Distribues 1 shot', answer: 'Oui' }; 
       

        //5ème columne (Health)
        case 5:
          return { question: `Les docteurs recommendent de le faire très souvent ?`, answer: 'respirer' };
        case 11:
          return { question: `Est ce que l'eau est bien pour enlever le sang d un tapis ?`, answer: 'Bof' }; // change
        case 17:
          return { question: 'Paul se bat avec 3 docteurs combien de pommes doit il manger pour gagner ?', answer: 'Peu importe c est 3 contre 1 il perd' };  
        case 23:
          return { question: `Une personne se retrouve avec la tête détaché mais ne meurt pas, pourquoi ?`, answer: 'Il était déjà mort' };
          // Add picture
        case 29:
          return { question: 'Que faire si une personne est inconsciente sur un pouf ?', answer: 'La trainer dans la chambre de Sasha' };  //change maybe ? 
        case 35:
          return { question: 'Quels sont les 3 macronutriments', answer: 'glucides, lipides, protéines' };  // change
        case 41:
          return { question: 'Que fais tu quand tu es appelé pour testifier de ta participation dans un meurte', answer: 'Tu plaides coupable. Je vous connais aucune confiance.' }; 
        case 47:
          return { question: 'Quel est la manière la plus conne de se faire une déchirure musculaire ?', answer: 'éternuer' }; 
        

           //5ème columne (Shenanigans)
        case 6:
          return { question: `Est ce que tu penses que je suis schizophrène ?`, answer: 'Je ne te parlais pas prends 3 gorgées.' };
        case 12:
          return { question: `Ce film est une suite de shrek`, answer: 'Shrek 3' };
        case 18:
          return { question: 'Est ce que la bite est un fruit', answer: 'Non' };  
        case 24:
          return { question: `Quel est le QI le plus faible jamais enregistré pendant un test ?`, answer: 'On ne peut pas savoir Sasha n en a pas passé' };
        case 30:
          return { question: 'Cette personne est mauvaise au lit', answer: 'Paul' };  
        case 36:
            return { question: 'Qu est ce que l agachienne ?', answer: 'Une technique de chasse sous marine qui mélange l agachon et l indienne' };  
        case 42:
            return { question: 'Quel est le Fursona de Paul ?', answer: 'Le bernacle (if you know you know )' };
        case 48:
            return { question: 'Qui est la meilleur waifu ? Nami, Hinata, Yor, Yumeko, Robin ?', answer: 'Personne ne battera jamais Nami' };
          
        

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
        🎓 Welcome to Trivia 4
      </h1>
      <table className={styles['centered-table']}>
      <thead>
        <tr>
          <th className={styles["space-columns"]}>🎮 Jeux videos</th>
          <th className={styles["space-columns"]}>🌕 Astronomy</th>
          <th className={styles["space-columns"]}>🧮 Computer Science</th>
          <th className={styles["space-columns"]}>🐒 Monkey</th>
          <th className={styles["space-columns"]}>👨‍⚕️ Health</th>
          <th className={styles["space-columns"]}>❓ Shenanigans</th>
        </tr>
      </thead>
        <tbody>
        
          {Array.from({ length: 8 }, (_, rowIndex) => (
            <tr key={rowIndex}>
            {Array.from({ length: 6 }, (_, colIndex) => {
              const buttonNumber = (colIndex + rowIndex * 6) + 1;
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
