import { useEffect, useState } from 'react';

export default function CharArea() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Fetch messages
  useEffect(() => {
    fetch('')
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

  return <main></main>;
}
