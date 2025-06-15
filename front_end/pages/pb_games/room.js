import { useEffect, useState } from "react";

export default function RoomPage() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/room_messages", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
        } else {
          setMessages(["You are not in a room or session expired."]);
        }
      });
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Room Messages</h1>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
