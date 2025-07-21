import React, { useState, useEffect } from 'react';

const MemeCanvas = ({ meme, captions, setCaptions }) => {
  const DESIGN_WIDTH = 600;
  const DESIGN_HEIGHT = 400;

  // Responsive font size state
  const [fontSize, setFontSize] = useState('1rem');
  const [padding, setPadding] = useState('4px');

  useEffect(() => {
    const updateFontSize = () => {
      if (window.innerWidth <= 600) {
        setFontSize('0.8rem');
        setPadding('2px');
      } else {
        setFontSize('1rem');
        setPadding('4px');
      }
    };

    updateFontSize();
    window.addEventListener('resize', updateFontSize);
    return () => window.removeEventListener('resize', updateFontSize);
  }, []);

  if (!meme || !meme.filename || !Array.isArray(meme.caption_slots)) {
  return <div>Loading meme...</div>;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: `${DESIGN_WIDTH}px` }}>
      <img
        src={`/images/mim/${meme.filename}`}
        alt={meme.id}
        style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block' }}
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
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              textAlign: 'center',
              resize: 'none',
              overflowWrap: 'break-word',
              maxWidth: '100%',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          />
        );
      })}
    </div>
  );
};

export default MemeCanvas;
