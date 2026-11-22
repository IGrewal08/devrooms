import { useEffect, useState } from 'react';
import UserProfileFooter from './UserProfileFooter';

/**
 * Sidebar (Left Column)
 * Displays the DevRooms brand header, workspace card, active rooms list,
 * inline room creation form, project artifacts section, and user profile footer.
 */
export default function Sidebar({
    rooms: initialRooms,
    currentRoom,
    handleChangeRoom,
}) {
    const [rooms, setRooms] = useState(initialRooms || []);
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState('test_user_one');
    const [newRoomName, setNewRoomName] = useState('');

    // Sync rooms from App.jsx once fetched, or fall back to direct fetch if mounted standalone
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

        if (initialRooms && initialRooms.length > 0) {
            setRooms(initialRooms);
        } else {
            fetchSideData();
        }
        // TODO create projects (table in db)
        // TODO fetching diff users on auth (GET /users/me).
    }, [initialRooms]);

    // Create a new room via POST /api/rooms and append it to the sidebar list
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

    // Normalize user display object for UserProfileFooter
    const footerUser =
        typeof user === 'string'
            ? { username: user, status: 'Online' }
            : user;

    // TODO "loading" on fetch
    return (
        <aside id="panel" className="dr-sidebar">
            {/* Brand header matching Figma: DevRooms BETA */}
            <div id="title" className="dr-brand-header">
                <div className="dr-brand-logo">D</div>
                <h1 className="dr-brand-title">DevRooms</h1>
                <span className="dr-beta-badge">BETA</span>
            </div>

            <div id="sidebarMain">
                {/* Workspace selector card (Active Projects section) */}
                <div className="section dr-workspace-card">
                    <div className="dr-workspace-icon">O</div>
                    <div className="dr-workspace-meta">
                        <div className="dr-workspace-name">Orbit workspace</div>
                        <div className="dr-workspace-sub">Team workspace</div>
                    </div>
                </div>

                {/* Active Rooms list */}
                <div className="section dr-sidebar-section">
                    <div className="dr-section-header">
                        <span className="dr-section-label">ACTIVE ROOMS</span>
                        <span className="dr-section-count">{rooms.length}</span>
                    </div>

                    <ul id="roomList">
                        {rooms.map((room, index) => {
                            const isActive =
                                currentRoom &&
                                room.room_id !== undefined &&
                                currentRoom.room_id === room.room_id;

                            return (
                                <li
                                    onClick={() => handleChangeRoom(room)}
                                    key={room.room_id || index}
                                    className={`roomItem ${isActive ? 'dr-room-active' : ''}`}
                                >
                                    <span className="dr-room-icon">&lt;/&gt;</span>
                                    <div className="dr-room-text">
                                        <div className="dr-room-name">{room.title || room}</div>
                                        <div className="dr-room-desc">
                                            {room.description || 'Room chat'}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Inline "New room name... +" form preserving handleCreateRooms */}
                    <form onSubmit={handleCreateRooms} className="dr-new-room-form">
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="New room name..."
                            className="dr-new-room-input"
                        />
                        <button
                            type="submit"
                            className="dr-new-room-btn"
                            title="Create new room"
                        >
                            +
                        </button>
                    </form>
                </div>

                {/* Project / Shared artifacts section */}
                <div className="section dr-sidebar-section">
                    <div className="dr-section-header">
                        <span className="dr-section-label">PROJECT</span>
                    </div>
                    <ul className="dr-project-list">
                        {projects.length > 0 ? (
                            projects.map((project, index) => (
                                <li key={index} className="dr-project-item">
                                    {project.name ? project.name : 'No Projects Were Found.'}
                                </li>
                            ))
                        ) : (
                            <li className="dr-project-item">
                                <span>Shared artifacts</span>
                                <span className="dr-section-count">0</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Bottom tagline and authenticated user status bar */}
            <UserProfileFooter
                user={footerUser}
                onOpenSettings={() => {
                    // TODO wire auth/account modal once user-service is connected
                }}
            />
        </aside>
    );
}