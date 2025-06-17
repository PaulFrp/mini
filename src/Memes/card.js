import React, { useEffect, useRef } from 'react';
import styles from './card.module.css';

const Card = ({ image, answer, isFlipped, handleCardClick, videoUrl}) => {
  const tiktokRef = useRef(null);

  useEffect(() => {
    if (videoUrl?.includes('tiktok.com')) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      tiktokRef.current?.appendChild(script);
    }
  }, [videoUrl]);

  return (
    <div>
    <div className={`${styles.card} ${isFlipped ? styles['card-flipped'] : ''}`} onClick={handleCardClick}>
      <div className={styles['card-content']}>
        <div className={styles['card-front']}>
          <img src={image} alt="Card visual" className={styles['card-image']} /> 
        </div>
        <div className={styles['card-back']}>
          <p>{answer}</p>
          {videoUrl && (
            <div className={styles['video-container']}>
  {!isFlipped && <div className={styles['video-blocker']} />}
  {videoUrl.includes('tiktok.com') ? (
    <div ref={tiktokRef}>
      <blockquote 
        className="tiktok-embed" 
        cite={videoUrl}
        data-video-id={videoUrl.split('/video/')[1]}
        style={{ width: '300px', height: '550px' }}
      >
        <section>Loading TikTok...</section>
      </blockquote>
    </div>
  ) : (
    <iframe
      width="300"
      height="200"
      src={videoUrl}
      title="Embedded video"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  )}
</div>

          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default Card;
