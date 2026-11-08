import { useEffect, useState } from 'react';
import './App.css';

export default function CharArea({ currentRoom }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Fetch messages
  useEffect(() => {
    fetch('http://localhost:4000/api/messages')
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error(err));
  }, []);

  const handleMessageInput = (e) => {
    e.preventDefault();
    fetch('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: inputText }),
    })
      .then((res) => res.json())
      .then((data) => setInputText(data.message))
      .catch((err) => console.error(err));
  };

  return (
    <main id="container">
      <div id="roomHeader">
        <h1>{currentRoom ? currentRoom : 'Default Room'}</h1>
      </div>
      <div id="chatContentBox">
        <div id="chatLogBox">
          <ul>
            {messages.map((message, index) => (
              <li
                key={index}
                id="chat"
              >
                <span class="posterHeader">{message.username}</span>
                <span class="chatContent">{message.message}</span>
              </li>
            ))}
          </ul>
        </div>
        <form
          onSubmit={handleMessageInput}
          id="inputContainer"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Chat in this room"
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </main>
  );
}
