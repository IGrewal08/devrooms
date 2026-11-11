import { useState, useEffect } from 'react';
import './App.css';

export default function RightPanel({ currentRoom }) {
  const [activeUsers, setActiveUsers] = useState([
    { id: 1, name: 'text_user_one' },
  ]);
  const [agentInfo, setAgentInfo] = useState({
    name: 'DevRooms Assistant',
    info: 'Helps analyze code, coordinate sprints, and provide context for this room.',
  });

  // fetch active users list and agent information
  useEffect(() => {
    // TODO list of active user (websocket implementation)
    // TODO db for agents
  }, [currentRoom]);

  return (
    <aside id="panel">
      <div className="section">
        <h2>List of active users in room</h2>
        <ul>
          {activeUsers.length > 0 ? (
            activeUsers.map((user, index) => (
              <li key={index}>{user.name || user}</li>
            ))
          ) : (
            <li>No active users</li>
          )}
        </ul>
      </div>

      <div className="section">
        <h2>Information about the AI agent and its capabilities</h2>
        <div>
          <h4>{agentInfo ? agentInfo.name : 'No Agent available'}</h4>
          <p>
            {agentInfo ? agentInfo.info : 'No Agent information available.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
