import { useEffect, useState } from 'react';
import './App.css';

export default function ChatArea({ currentRoom }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Fetch messages
  useEffect(() => {
    async function fetchMessages() {
      if (!currentRoom || !currentRoom.room_id) {
        setMessages([]);
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:3000/api/rooms/${currentRoom.room_id}/messages`,
        );
        const data = await response.json();

        if (data.data) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    }
    fetchMessages();
  }, [currentRoom]);

  const handleMessageInput = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentRoom) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/rooms/${currentRoom.room_id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 1, //HARD CODED FOR SPRINT 1
            userMessage: inputText,
          }),
        },
      );
      const data = await response.json();

      if (response.ok && data.data) {
        setMessages((prevMessages) => [...prevMessages, data.data[0]]);
        setInputText('');
      } else {
        console.error('Failed to send message', data.message);
      }
    } catch (err) {
      console.error('Error posting messages:', err);
    }
  };

  return (
    <main id="container">
      <div id="roomHeader">
        <h1>{currentRoom ? currentRoom.title : 'Select a Room'}</h1>
      </div>
      <div id="chatContentBox">
        <div id="chatLogBox">
          <ul>
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <li
                  key={index}
                  id="chat"
                >
                  <span className="posterHeader">
                    {message.username || 'User'}
                  </span>
                  <span className="chatContent">{message.message}</span>
                </li>
              ))
            ) : (
              <p className="no-messages">No messages yet!</p>
            )}
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
            placeholder={
              currentRoom ? 'Chat in this room' : 'Select a room first'
            }
            disabled={!currentRoom}
          />
          <button
            type="submit"
            disabled={!currentRoom}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
