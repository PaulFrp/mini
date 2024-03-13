import React from 'react';
import NavigationBar from './navBar';
import styles from "./navBar.module.css";

function App() {
  return (
    <div className={styles['background-image']}>
       <NavigationBar />
    </div>
  );
}

export default App;
