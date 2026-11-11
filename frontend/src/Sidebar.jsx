import { useEffect, useState } from 'react';

export default function Sidebar({ rooms: initialRooms, handleChangeRoom }) {
  const [rooms, setRooms] = useState(initialRooms || []);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState('test_user_one');
  const [newRoomName, setNewRoomName] = useState('');

  // Fetch rooms and projects on initial mount
  useEffect(() => {
    async function fetchSideData() {
      try {
        const roomResponse = await fetch('http://localhost:3000/api/rooms');
        const roomResult = await roomResponse.json();

        if (roomResult.data) {
          setRooms(roomResult.data);
        }
      } catch (err) {
        console.error('Failed to fetch rooms in sidebar: ', err);
      }
    }

    if (!initialRooms || initialRooms.length === 0) {
      fetchSideData();
    }
    // TODO create projects (table in db)
    // TODO fetching diff users on auth.
  }, [initialRooms]);

  // room handler
  const handleCreateRooms = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const response = await fetch('http://localhost:3000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          title: newRoomName,
          description: 'Room create from sidebar',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setRooms((prevRooms) => [...prevRooms, result.data[0]]);
        setNewRoomName('');
      } else {
        console.error('Failed to create room:', result.message);
      }
    } catch (err) {
      console.error('Error creating room: ', err);
    }
  };

  // TODO "loading" on fetch
  return (
    <aside id="panel">
      <div id="title">
        <h1>DevRooms</h1>
      </div>
      <div id="sidebarMain">
        <div className="section">
          <h3>Active Projects</h3>
        </div>

        <div className="section">
          <h3>List of Created Rooms</h3>
          <ul id="roomList">
            {rooms.map((room, index) => (
              <li
                onClick={() => handleChangeRoom(room)}
                key={index}
                className="roomItem"
              >
                {room.title || room}
              </li>
            ))}
          </ul>
        </div>
        <div className="section">
          <h3>Create A New Room</h3>
          <form onSubmit={handleCreateRooms}>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room Name"
            />
            <button type="submit">Create</button>
          </form>
        </div>
        <div className="section">
          <h3>List of Projects</h3>
          <ul>
            {projects.map((project, index) => (
              <li key={index}>
                {project.name ? project.name : 'No Projects Were Found.'}
              </li>
            ))}
          </ul>
        </div>
        <div className="section">
          <h3>User Information</h3>
          <h4>{user}</h4>
        </div>
      </div>
    </aside>
  );
}
