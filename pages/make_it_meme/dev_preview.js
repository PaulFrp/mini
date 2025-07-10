import { useEffect, useState } from "react";
import MemeCanvas from "./memecanvas";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, '');

export default function MemeTemplatePreview() {
  const [memeTemplates, setMemeTemplates] = useState([]);
  const [captions, setCaptions] = useState([]);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch(`${BACKEND_URL}/meme/templates`);
        const data = await res.json();
        console.log("Fetched meme templates:", data); // ✅ will now show when fetch completes
        setMemeTemplates(data);
      } catch (error) {
        console.error("Failed to fetch meme templates:", error);
      }
    }

    fetchTemplates();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Meme Template Preview</h1>
      {memeTemplates.length === 0 ? (
        <p>Loading templates...</p>
      ) : (
        memeTemplates.map((template) => (
          <div key={template.id} style={{ marginBottom: "3rem" }}>
            <h2>{template.id}</h2>
            <div style={{ position: "relative", display: "inline-block" }}>
              <MemeCanvas
                meme={template}
                captions={captions}
                setCaptions={setCaptions}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
