import React, { useState } from 'react';
import Card from './card'; // Import the Card component
import styles from './card.module.css'; // Correct import statement


const Trivia = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [clickedButtons, setClickedButtons] = useState([]);

  const showCard = (number) => {
    setSelectedCard(number);
    setClickedButtons((prevClickedButtons) => [...prevClickedButtons, number]);
    
  };

  const getCardTexts = (number) => {
    
    switch (number) {
        
        //1ère colomne 
        case 1:
          return { question: `Plus de 75% de la surface de la terre est recouverte d':`, answer: "D'air" };
        case 6:
          return { question: 'Ce pays se trouve au nord de la Corée du Sud', answer: 'La Corée du Nord' };
        case 11:
          return { question: `1515 ? `, answer: 'Marignan' };
        case 16:
          return { question: 'Le président de ce pays est connu pour avoir un tout petit penis', answer: 'Russie' };
        case 21:
          return { question: `Quel animal peut retenir sa respiration le plus longtemps sous l'eau ? `, answer: 'Le poisson' };
        case 26:
          return { question: "Malgré ce que beaucoup de personne pensent, C'est la plus haute montagne", answer: 'Mt. Everest' };
        case 31:
          return { question: `Qu'est ce qu'il est illégal de faire dans un vignoble`, answer: 'Posé une soucoupe volante' };
        
        //2ème columne 
        case 2:
          return { question: 'Quand A est vrai B est toujours vrai. Si A est faux que savons nous de B ', answer: 'Rien' };
        case 7:
          return { question: `Paul a 10 bougies et chaque bougies tiens 10min Paul allume toutes ses bougies, Combien de temps vont-elles bruler ? `, answer: '100 minutes' };
        case 12:
          return { question: 'Paul donne 7€ à sa fille et 4€ à son fils, quelle heure est-il ?', answer: "L'heure actuelle" };
        case 17:
          return { question: `Combien valait 1$ en 1973`, answer: '1$' };
          //Add picture of the bird 
        case 22:
          return { question: "Qu'est ce que c'est ? ", answer: 'Un oiseau ' };  
        case 27:
          return { question: `Quelle est la réponse la moins commune à la question: choisi un nombre entre 1 et 10`, answer: '10' };
        case 32:
          return { question: 'Pendant quelle décénie le premier ordinateur a été designé ? ', answer: '1822' };  
        
        //3ème columne 
        case 3:
          return { question: `Vrai ou Faux, tu as un trou dans les poumons sans lequel tu ne pourrais pas vivre ?`, answer: 'Vrai' };
        case 8:
          return { question: "Quel est l'organe le plus flemmard", answer: 'Le cerveau' };  
        case 13:
          return { question: `Pourquoi est ce que les squelettes ne se battent pas ?`, answer: 'Ils ont pas les couilles' };
        case 18:
          return { question: 'Vrai ou faux (explique ta réponse). Un humain peut 100% survivre sans estomac', answer: 'Vrai' };  
        case 23:
          return { question: `Alors que certaines personnes naissent sans, ceux qui naissent avec ont tendance a le couper pour des raisons d'hygiène`, answer: 'Les cheuveux......' };
        case 28:
          return { question: 'De quelle artère proviennent les artères fessières supérieure et inférieure ?', answer: 'Aucune idée' }; 
        case 33:
          return { question: `Quel état de la matière manque à la liste ? Solide, Liquide, Gazeux, Plasma et ? `, answer: 'Condensât de bose Einstein ' };

        //4ème columne 
        case 4:
          return { question: 'Quel est le meilleur type de pokemon ? ', answer: 'Dragon' };   
        case 9:
          return { question: `C'est une créature mythique avec des écailles et une peau de lézard et parfois plusieurs têtes ? `, answer: 'Hydre' };
        case 14:
          return { question: 'Quel est le meilleur jeux-vidéo ?', answer: 'Le conseil va décidé.' };  
        case 19:
          return { question: `Un soigneur, un tank et un sorcier rentrent dans un bar. Quel est le problème avec cette phrase ?  `, answer: 'Le tank devrait entrer en premier' };
        case 24:
          return { question: 'Donne moi un nombre entre 1 et 20 ? ', answer: '-=10 raté +10 gagné' };  
        case 29:
          return { question: `Qu'est ce qu'un hentai ?`, answer: "Aucune idée on va croire l'expert du coup" };
        case 34:
          return { question: 'Quel est ton pokémon préféré ?', answer: 'Le conseil va décidé si tu as raison.' }; 

        //5ème columne 
        case 5:
          return { question: `Quel fruit a créé la gravité ?`, answer: 'Une pomme' };
        case 10:
          return { question: `Donne moi un grand nombre ?`, answer: '> 1 trillion' };
        case 15:
          return { question: 'A 10 décimales près, combien de luminosités solaires le soleil a-t-il ?', answer: '1' };  
        case 20:
          return { question: `Quel est ma glace préféré ?`, answer: 'Stracciatella ' };
        case 25:
          return { question: 'Pourquoi les protons ne se repoussent-ils pas les uns les autres dans un atome ?', answer: 'La force nucléaire est plus forte que la force électromagnétique à des distances plus petites.' };  
        case 30:
          return { question: "Qu'est ce que ca veut dire si le chat miaule ?", answer: "Que Schrodinger l'a dans le cul" };
        case 35:
          return { question: "Quelle est l'appromixation normalement utilisé pour la vitesse de la lumière ?", answer: '3x10^8 m/s ou C' };
        

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
    <div>
      <h1>Welcome to trivia </h1>
      <table className={styles['centered-table']}>
      <thead>
          <tr>
            <th className={styles["space-columns"]}>Geographie</th>
            <th className={styles["space-columns"]}>Logique</th>
            <th className={styles["space-columns"]}>Anatomie </th>
            <th className={styles["space-columns"]}>Fantaisie</th>
            <th className={styles["space-columns"]}>Physique quantique</th>
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

      {selectedCard && <Card className={styles["centered-cell"]} question={question} answer={answer} />}
    


      
      
       
    </div>
  );
};

export default Trivia;
