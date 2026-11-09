import { useEffect, useState } from 'react';
import './App.css';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import RightPanel from './RightPanel';
import { socket, API_BASE_URL } from './socket';

export default function App() {
    // 1. Login Authentication State (Password: admin123)
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = sessionStorage.getItem('devrooms_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loginName, setLoginName] = useState('Vin Ong');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState('');

    // 2. Rooms, Active Room & Real-Time Presence State
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);

    // 3. Repository Files, Pull Requests & Issues State
    const [repoData, setRepoData] = useState({ files: {}, branches: [], pullRequests: [] });
    const [issues, setIssues] = useState([]);
    const [activeModal, setActiveModal] = useState(null); // 'repo' | 'issues' | null

    // Fetch initial rooms, repo files, and issues
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/rooms`)
            .then((res) => res.json())
            .then((resData) => {
                const list = resData.data || [];
                setRooms(list);
                if (list.length > 0 && !currentRoom) {
                    setCurrentRoom(list[0]);
                }
            })
            .catch((err) => console.error(err));

        fetch(`${API_BASE_URL}/api/repo`)
            .then((res) => res.json())
            .then((data) => setRepoData(data))
            .catch(() => { });

        fetch(`${API_BASE_URL}/v1/issues`)
            .then((res) => res.json())
            .then((resData) => setIssues(resData.data || []))
            .catch(() => { });
    }, []);

    // Join Socket.IO room when authenticated or when switching rooms
    useEffect(() => {
        if (!currentUser || !currentRoom) return;

        const roomId = currentRoom.room_id;
        socket.emit('room:join', { roomId, user: currentUser });

        const onConnect = () => {
            setIsSocketConnected(true);
            socket.emit('room:join', { roomId, user: currentUser });
        };
        const onDisconnect = () => {
            setIsSocketConnected(false);
            setActiveUsers([]);
        };
        const onPresenceUpdate = (payload) => {
            if (payload.roomId === roomId) {
                setActiveUsers(payload.members || []);
            }
        };
        const onTypingUpdate = (payload) => {
            if (payload.roomId === roomId) {
                setTypingUsers(payload.typingUsers || []);
            }
        };
        const onRoomsUpdated = (updatedList) => {
            setRooms(updatedList);
        };
        const onIssuesUpdated = (updatedIssues) => {
            setIssues(updatedIssues);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('presence:update', onPresenceUpdate);
        socket.on('typing:update', onTypingUpdate);
        socket.on('rooms:updated', onRoomsUpdated);
        socket.on('issues:updated', onIssuesUpdated);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('presence:update', onPresenceUpdate);
            socket.off('typing:update', onTypingUpdate);
            socket.off('rooms:updated', onRoomsUpdated);
            socket.off('issues:updated', onIssuesUpdated);
        };
    }, [currentUser, currentRoom]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginName, password: loginPass })
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginError(data.message || 'Invalid credentials. Use password: admin123');
                return;
            }
            sessionStorage.setItem('devrooms_user', JSON.stringify(data.user));
            setCurrentUser(data.user);
            setLoginPass('');
        } catch {
            if (loginPass === 'admin123') {
                const fallback = {
                    userId: 1,
                    username: loginName,
                    name: loginName,
                    initials: loginName.slice(0, 2).toUpperCase(),
                    role: 'Developer'
                };
                sessionStorage.setItem('devrooms_user', JSON.stringify(fallback));
                setCurrentUser(fallback);
            } else {
                setLoginError('Invalid password. Use admin123.');
            }
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('devrooms_user');
        socket.disconnect();
        setCurrentUser(null);
        setActiveUsers([]);
        socket.connect();
    };

    const handleChangeRoom = (roomObj) => {
        setTypingUsers([]);
        setCurrentRoom(roomObj);
    };

    // Render Login Gate if not signed in
    if (!currentUser) {
        return (
            <div className="modalOverlay" style={{ background: '#090a0f' }}>
                <div className="modalCard" style={{ maxWidth: '420px' }}>
                    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ color: '#fff', margin: 0 }}>DevRooms Login</h2>
                            <span className="betaBadge">Velocity Labs • Group 12</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                            Collaborative Agentic AI Workspace — Vin Ong & Inder Grewal
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        <button
                            type="button"
                            onClick={() => setLoginName('Vin Ong')}
                            className="actionBtn"
                            style={{
                                flex: 1,
                                borderColor: loginName === 'Vin Ong' ? '#6366f1' : '#282d3e'
                            }}
                        >
                            Vin Ong (VO)
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginName('Inder Grewal')}
                            className="actionBtn"
                            style={{
                                flex: 1,
                                borderColor: loginName === 'Inder Grewal' ? '#6366f1' : '#282d3e'
                            }}
                        >
                            Inder Grewal (IG)
                        </button>
                    </div>

                    <form onSubmit={handleLogin}>
                        {loginError && (
                            <div
                                style={{
                                    background: 'rgba(239,68,68,0.15)',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    color: '#fca5a5',
                                    padding: '8px 10px',
                                    borderRadius: '7px',
                                    fontSize: '12px',
                                    marginBottom: '12px'
                                }}
                            >
                                {loginError}
                            </div>
                        )}

                        <div className="formField">
                            <label>Developer Username</label>
                            <input
                                type="text"
                                value={loginName}
                                onChange={(e) => setLoginName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="formField">
                            <label>Password (use: admin123)</label>
                            <input
                                type="password"
                                value={loginPass}
                                onChange={(e) => setLoginPass(e.target.value)}
                                placeholder="admin123"
                                required
                            />
                        </div>

                        <button type="submit" className="sendBtn" style={{ width: '100%', padding: '10px' }}>
                            Sign In to DevRooms
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Top Workspace Status Bar */}
            <div className="topStatusBar">
                <div className="topStatusLeft">
                    <strong style={{ color: '#fff' }}>Velocity Labs • Group 12</strong>
                    <span>|</span>
                    <span>Developers: Vin Ong & Inder Grewal</span>
                </div>

                <div className="topStatusRight">
                    <span className={`statusBadge ${isSocketConnected ? 'online' : 'offline'}`}>
                        ● {isSocketConnected ? `Connected (${activeUsers.length} in room)` : 'Offline'}
                    </span>
                    <span>
                        Signed in as <strong style={{ color: '#a5b4fc' }}>{currentUser.username}</strong>
                    </span>
                    <button onClick={handleLogout} className="actionBtn" style={{ padding: '2px 8px' }}>
                        Sign out
                    </button>
                </div>
            </div>

            {/* 3-Column Cloned Repo Structure (#mainContainer) */}
            <div id="mainContainer">
                <Sidebar
                    rooms={rooms}
                    setRooms={setRooms}
                    currentRoom={currentRoom}
                    handleChangeRoom={handleChangeRoom}
                    currentUser={currentUser}
                    issuesCount={issues.length}
                    onOpenModal={(modalName) => setActiveModal(modalName)}
                />

                <ChatArea
                    currentRoom={currentRoom}
                    currentUser={currentUser}
                    typingUsers={typingUsers}
                    onOpenModal={(modalName) => setActiveModal(modalName)}
                />

                <RightPanel
                    activeUsers={activeUsers}
                    currentRoom={currentRoom}
                    currentUser={currentUser}
                    issues={issues}
                    setIssues={setIssues}
                    repoData={repoData}
                    setRepoData={setRepoData}
                    activeModal={activeModal}
                    setActiveModal={setActiveModal}
                />
            </div>
        </div>
    );
}