import { useEffect, useState } from 'react';
import './App.css';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import RightPanel from './RightPanel';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const response = await fetch('http://localhost:3000/api/rooms');
        const result = await response.json();

        if (result.data && result.data.length > 0) {
          setRooms(result.data);
          setCurrentRoom(result.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch rooms: ', err);
      }
    }
    fetchRooms();
  }, []);

  const handleChangeRoom = (room) => {
    setCurrentRoom(room);
  };

  return (
    <div id="mainContainer">
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        handleChangeRoom={handleChangeRoom}
      />
      <ChatArea currentRoom={currentRoom} />
      <RightPanel />
    </div>
  );
}

export default App;
