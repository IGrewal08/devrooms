import { useEffect, useState } from 'react';
import './App.css';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import RightPanel from './RightPanel';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    fetch('')
      .then((res) => res.json())
      .then((data) => setCurrentRoom(data[0]))
      .catch((err) => console.error(err));
  }, []);

  const handleChangeRoom = (e) => {
    e.preventDefault();
  };

  return (
    <div id="mainContainer">
      <Sidebar handleChangeRoom={(e) => handleChangeRoom} />
      <ChatArea currentRoom={currentRoom} />
      <RightPanel />
    </div>
  );
}

export default App;
