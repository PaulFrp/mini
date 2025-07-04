const MemeCanvas = ({ meme, captions, setCaptions }) => {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={`/images/mim/${meme.filename}`}
          alt={meme.id}
          style={{ maxWidth: '100%', display: 'block' }}
        />
  
        {meme.caption_slots.map((slot, i) => (
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
              left: slot.x,
              top: slot.y,
              width: slot.width,
              height: slot.height,
              fontSize: '16px',
              padding: '4px',
              boxSizing: 'border-box',
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        ))}
      </div>
    );
  };
  
export default MemeCanvas;