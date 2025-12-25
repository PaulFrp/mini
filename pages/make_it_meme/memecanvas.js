import React, { useState, useEffect } from 'react';

const MemeCanvas = ({ meme, captions, setCaptions }) => {
  const DESIGN_WIDTH = 600;
  const DESIGN_HEIGHT = 400;

  // Responsive font size state
  const [fontSize, setFontSize] = useState('1rem');
  const [padding, setPadding] = useState('6px');
  const [borderWidth, setBorderWidth] = useState('2px');

  useEffect(() => {
    const updateResponsiveStyles = () => {
      const width = window.innerWidth;
      
      if (width <= 400) {
        // Very small phones
        setFontSize('0.7rem');
        setPadding('3px');
        setBorderWidth('1px');
      } else if (width <= 600) {
        // Small phones and medium devices
        setFontSize('0.85rem');
        setPadding('4px');
        setBorderWidth('1.5px');
      } else {
        // Desktop and tablets
        setFontSize('1rem');
        setPadding('6px');
        setBorderWidth('2px');
      }
    };

    updateResponsiveStyles();
    window.addEventListener('resize', updateResponsiveStyles);
    return () => window.removeEventListener('resize', updateResponsiveStyles);
  }, []);

  if (!meme || !meme.filename || !Array.isArray(meme.caption_slots)) {
    return <div style={{ padding: '1rem', textAlign: 'center' }}>Loading meme...</div>;
  }

  return (
    <div style={{ 
      position: 'relative', 
      display: 'inline-block', 
      width: '100%', 
      maxWidth: `${DESIGN_WIDTH}px`,
      margin: '0 auto'
    }}>
      <img
        src={`/images/mim/${meme.filename}`}
        alt={meme.id}
        style={{ 
          width: '100%', 
          maxWidth: '100%', 
          height: 'auto', 
          display: 'block',
          borderRadius: '8px'
        }}
      />

      {meme.caption_slots.map((slot, i) => {
        const xPercent = (slot.x / DESIGN_WIDTH) * 100;
        const yPercent = (slot.y / DESIGN_HEIGHT) * 100;
        const widthPercent = (slot.width / DESIGN_WIDTH) * 100;
        const heightPercent = (slot.height / DESIGN_HEIGHT) * 100;

        return (
          <textarea
            key={i}
            placeholder={`Caption ${i + 1}`}
            value={captions[i] || ""}
            onChange={(e) => {
              const newCaptions = [...captions];
              newCaptions[i] = e.target.value;
              setCaptions(newCaptions);
            }}
            style={{
              position: 'absolute',
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
              fontSize,
              padding,
              boxSizing: 'border-box',
              backgroundColor: 'rgba(255,255,255,0.85)',
              border: `${borderWidth} solid #4caf50`,
              borderRadius: '4px',
              textAlign: 'center',
              resize: 'none',
              overflowWrap: 'break-word',
              maxWidth: '100%',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              fontFamily: 'Arial, sans-serif',
              fontWeight: '600',
              lineHeight: '1.2',
              color: '#000',
            }}
          />
        );
      })}
    </div>
  );
};

export default MemeCanvas;
