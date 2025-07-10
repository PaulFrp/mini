const MemeCanvas = ({ meme, captions, setCaptions }) => {
  const DESIGN_WIDTH = 600;  // ← the width used when designing meme templates
  const DESIGN_HEIGHT = 400; // ← adjust if needed

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: `${DESIGN_WIDTH}px` }}>
      <img
        src={`/images/mim/${meme.filename}`}
        alt={meme.id}
        style={{ width: '100%', display: 'block' }}
      />

      {meme.caption_slots.map((slot, i) => {
        const xPercent = (slot.x / DESIGN_WIDTH) * 100;
        const yPercent = (slot.y / DESIGN_HEIGHT) * 100;
        const widthPercent = (slot.width / DESIGN_WIDTH) * 100;
        const heightPercent = (slot.height / DESIGN_HEIGHT) * 100;

        return (
          <input
            key={i}
            type="text"
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
              fontSize: '1rem',
              padding: '4px',
              boxSizing: 'border-box',
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          />
        );
      })}
    </div>
  );
};

export default MemeCanvas;
