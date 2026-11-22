import { useState, useEffect } from 'react';
import './App.css';
import RoomMembersList from './RoomMembersList';
import QuickToolsPanel from './QuickToolsPanel';

/**
 * RightPanel (Right Column)
 * Shows room context search, active users in the room, DevAgent status,
 * current room summary, and quick agentic tools.
 */
export default function RightPanel({ currentRoom }) {
    const [activeUsers, setActiveUsers] = useState([
        { id: 1, name: 'text_user_one' },
    ]);
    const [agentInfo, setAgentInfo] = useState({
        name: 'DevRooms Assistant',
        info: 'Helps analyze code, coordinate sprints, and provide context for this room.',
    });
    const [searchQuery, setSearchQuery] = useState('');

    // fetch active users list and agent information
    useEffect(() => {
        // TODO list of active user (websocket implementation)
        // TODO db for agents
    }, [currentRoom]);

    // Filter active users when typing in the "Search room context" box
    const filteredUsers = activeUsers.filter((user) => {
        const label = typeof user === 'string' ? user : user.name || user.username || '';
        return label.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Placeholder handlers ready for Sprint 2 Groq AI service (port 4003)
    const handleSummarizeRoom = () => {
        console.log('Trigger AI summary for room:', currentRoom?.room_id);
    };

    const handleCreateMermaid = () => {
        console.log('Trigger AI Mermaid diagram for room:', currentRoom?.room_id);
    };

    return (
        <aside id="panel" className="dr-right-panel">
            {/* Panel header matching Figma: Room context */}
            <div className="dr-right-header">
                <h2 className="dr-right-title">Room context</h2>
            </div>

            {/* Room context search input */}
            <div className="dr-search-box">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search room context"
                    className="dr-search-input"
                />
                <span className="dr-search-kbd">⌘K</span>
            </div>

            {/* IN THIS ROOM active members list */}
            <RoomMembersList
                members={filteredUsers}
                onInvite={() => {
                    console.log('Invite clicked for room:', currentRoom?.room_id);
                }}
            />

            {/* YOUR ROOM AGENT + QUICK TOOLS */}
            <QuickToolsPanel
                agentStatus={agentInfo ? 'Ready to collaborate' : 'Unavailable'}
                currentSummary={
                    agentInfo ? agentInfo.info : 'No Agent information available.'
                }
                onSummarizeRoom={handleSummarizeRoom}
                onCreateMermaid={handleCreateMermaid}
            />
        </aside>
    );
}