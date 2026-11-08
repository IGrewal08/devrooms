import { useState, useEffect } from 'react';
import './App.css';

export default function RightPanel() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [agentInfo, setAgentInfo] = useState(null);

  // fetch active users list and agent information
  useEffect(() => {
    fetch('') // TODO list of active users in room
      .then((res) => res.json())
      .then((data) => setActiveUsers(data))
      .catch((err) => console.error(err));

    fetch('') // TODO name of current agent
      .then((res) => res.json())
      .then((data) => setAgentInfo(data))
      .catch((err) => console.error(err));
  }, []);

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
        <h2>
          Information about the AI agent and it's capabilities such as Tools
        </h2>
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
