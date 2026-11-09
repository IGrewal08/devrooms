import { useState } from 'react';
import { API_BASE_URL } from './socket';

export default function Sidebar({
    rooms,
    setRooms,
    currentRoom,
    handleChangeRoom,
    currentUser,
    issuesCount,
    onOpenModal
}) {
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomScope, setNewRoomScope] = useState('ISOLATED');

    const handleCreateRooms = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser?.userId || 1,
                    title: newRoomName.trim(),
                    scope: newRoomScope
                })
            });
            const resData = await res.json();
            if (res.ok && resData.rooms) {
                setRooms(resData.rooms);
                handleChangeRoom(resData.data);
                setNewRoomName('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteRoom = async (e, roomId) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
                method: 'DELETE'
            });
            const resData = await res.json();
            if (res.ok && resData.data) {
                setRooms(resData.data);
                if (currentRoom?.room_id === roomId && resData.data.length > 0) {
                    handleChangeRoom(resData.data[0]);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <aside id="panel">
            <div id="title">
                <h1>DevRooms</h1>
                <span className="betaBadge">GROUP 12</span>
            </div>

            <div id="sidebarMain">
                {/* Active Project Info */}
                <div className="section">
                    <h3>Active Project</h3>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        Velocity Labs — DevRooms
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Vin Ong & Inder Grewal
                    </div>
                </div>

                {/* List of Created Rooms (Click to switch, X to delete) */}
                <div className="section">
                    <h3>Workspaces & Rooms ({rooms.length})</h3>
                    <ul id="roomList">
                        {rooms.map((room) => {
                            const isActive = currentRoom?.room_id === room.room_id;
                            return (
                                <li
                                    key={room.room_id}
                                    onClick={() => handleChangeRoom(room)}
                                    className={`roomItem ${isActive ? 'active' : ''}`}
                                >
                                    <div className="roomMeta">
                                        <span>
                                            {room.scope === 'SHARED' ? '🌐 ' : '🌿 '}
                                            {room.title || room.name}
                                        </span>
                                        <span className="roomBranch">{room.branch}</span>
                                    </div>
                                    {room.room_id !== 'central' && (
                                        <button
                                            type="button"
                                            className="deleteRoomBtn"
                                            title="Delete room"
                                            onClick={(e) => handleDeleteRoom(e, room.room_id)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Create A New Room Form */}
                <div className="section">
                    <h3>Create A New Room</h3>
                    <form onSubmit={handleCreateRooms} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Feature room name..."
                            style={{
                                background: '#0c0e14',
                                border: '1px solid #282d3e',
                                color: '#fff',
                                borderRadius: '6px',
                                padding: '7px 9px',
                                fontSize: '12.5px'
                            }}
                        />
                        <select
                            value={newRoomScope}
                            onChange={(e) => setNewRoomScope(e.target.value)}
                            style={{
                                background: '#0c0e14',
                                border: '1px solid #282d3e',
                                color: '#cbd5e1',
                                borderRadius: '6px',
                                padding: '6px',
                                fontSize: '12px'
                            }}
                        >
                            <option value="ISOLATED">Isolated Room (Auto-Branch)</option>
                            <option value="SHARED">Shared Context Room</option>
                        </select>
                        <button type="submit" className="sendBtn" style={{ width: '100%' }}>
                            + Create Room & Branch
                        </button>
                    </form>
                </div>

                {/* Repository, Files & Bug/Issue Tracker Navigation */}
                <div className="section">
                    <h3>Repo, Files & Issues</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                            type="button"
                            onClick={() => onOpenModal('repo')}
                            className="actionBtn"
                            style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                        >
                            <span>📁 Repo Files & Branches</span>
                            <span style={{ color: '#818cf8' }}>View</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenModal('issues')}
                            className="actionBtn"
                            style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                        >
                            <span>🐛 GitHub Issues & Bugs</span>
                            <span style={{ color: '#6ee7b7', fontFamily: 'monospace' }}>{issuesCount}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Authenticated User Information */}
            <div className="section" style={{ marginTop: 'auto' }}>
                <h3>Authenticated User</h3>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {currentUser?.username}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{currentUser?.role}</div>
            </div>
        </aside>
    );
}