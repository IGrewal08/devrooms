import { useEffect, useState } from 'react';

export default function Sidebar() {
  const [rooms, setRooms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState('loading...');
  const [newRoomName, setNewRoomName] = useState('');

  // Fetch rooms and projects on initial mount
  useEffect(() => {
    fetch('')
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error(err));

    fetch('')
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error(err));

    fetch('')
      .then((res) => res.json())
      .then((data) => setUser(data.userName))
      .catch((err) => console.error(err));
  }, []);

  // room handler
  const handleCreateRooms = (e) => {
    e.preventDefault();
    fetch('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRoomName }),
    })
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error(err));
  };

  // TODO "loading" on fetch
  return (
    <aside>
      <div id="title">
        <h1>DevRooms</h1>
      </div>
      <div className="section">
        <h3>Active Projects</h3>
      </div>

      <div className="section">
        <h3>List of Created Rooms</h3>
        <ul>
          {rooms.map((room, index) => (
            <li key={index}>{room.name || room}</li>
          ))}
        </ul>
      </div>
      <div className="section">
        <h3>Create A New Room</h3>
        <form>
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
            <li key={index}>{project.name || project}</li>
          ))}
        </ul>
      </div>
      <div className="section">
        <h3>User Information</h3>
        <h4>{user.userName}</h4>
      </div>
    </aside>
  );
}
