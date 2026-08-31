import { useState } from 'react'
import axios from "axios"

import './App.css'

function App() {
  const [message, setMessage] = useState("");

const [messages, setMessages] = useState([]);

const sendMessage = async () => {
  if (!message.trim()) return;

 const userMessage={
  role:"User",
  text:message
 }

 const updatedMessages=[...messages,userMessage]

setMessage(updatedMessages)
setMessage("")




  try {
    const res = await axios.post(
      "http://localhost:5000/chat",
      {
        messages: updatedMessages,
      }
    );

    setMessages((prev) => [
      ...prev,
      {
        role: "AI",
        text: res.data.reply,
      },
    ]);
    console.log(messages)
  } catch (error) {
    console.error(error);
  }
};

  return (
    <>
    <div>
  <textarea
    value={message}
    onChange={(e) => setMessage(e.target.value)}
  />

  <button onClick={sendMessage}>
    Send
  </button>

<div>
  {messages.map((msg, index) => (
    <div key={index}>
      <strong>
        {msg.role === "User"
          ? "You"
          : "AI"}
        :
      </strong>

      <p>{msg.text}</p>
    </div>
  ))}
</div></div>
    </>
  )
}

export default App
