import { useEffect, useState } from 'react';
import './App.css';
import MessageItem from './MessageItem';
import ChatInputForm from './ChatInputForm';

/**
 * ChatArea (Center Column)
 * Displays the active room header, scrollable message stream (users + DevAgent),
 * and the bottom ChatInputForm composer.
 */
export default function ChatArea({ currentRoom }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [typingUsers] = useState([]); // Ready for Socket.io typing events

    // Fetch messages whenever the selected room changes
    useEffect(() => {
        async function fetchMessages() {
            if (!currentRoom || !currentRoom.room_id) {
                setMessages([]);
                return;
            }
            try {
                const response = await fetch(
                    `http://localhost:3000/api/rooms/${currentRoom.room_id}/messages`,
                );
                const data = await response.json();

                if (data.data) {
                    setMessages(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            }
        }
        fetchMessages();
    }, [currentRoom]);

    // Post a new message to the active room and append the saved row
    const handleMessageInput = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !currentRoom) return;
        try {
            const response = await fetch(
                `http://localhost:3000/api/rooms/${currentRoom.room_id}/messages`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: 1, //HARD CODED FOR SPRINT 1
                        userMessage: inputText,
                    }),
                },
            );
            const data = await response.json();

            if (response.ok && data.data) {
                setMessages((prevMessages) => [...prevMessages, data.data[0]]);
                setInputText('');
            } else {
                console.error('Failed to send message', data.message);
            }
        } catch (err) {
            console.error('Error posting messages:', err);
        }
    };

    return (
        <main id="container" className="dr-chat-column">
            {/* Figma top room bar with title, subtitle, and utility action icons */}
            <div id="roomHeader" className="dr-room-header">
                <div className="dr-room-header-left">
                    <span className="dr-room-header-icon">&lt;/&gt;</span>
                    <div>
                        <h1 className="dr-room-title">
                            {currentRoom ? currentRoom.title : 'Select a Room'}
                        </h1>
                        <p className="dr-room-subtitle">
                            {currentRoom?.description || 'Room chat, summaries and diagrams'}
                        </p>
                    </div>
                </div>
                <div className="dr-room-header-actions">
                    <button type="button" className="dr-icon-btn" title="Pinned items">
                        📌
                    </button>
                    <button type="button" className="dr-icon-btn" title="Notifications">
                        🔔
                    </button>
                    <button type="button" className="dr-icon-btn" title="Room options">
                        •••
                    </button>
                </div>
            </div>

            {/* Scrollable message stream + fixed bottom composer */}
            <div id="chatContentBox" className="dr-chat-content-box">
                <div id="chatLogBox" className="dr-chat-log-box">
                    <ul className="dr-message-list">
                        {messages.length > 0 ? (
                            messages.map((message, index) => (
                                <MessageItem
                                    key={message.message_id || message.id || index}
                                    message={message}
                                />
                            ))
                        ) : (
                            <p className="no-messages dr-empty-state">No messages yet!</p>
                        )}
                    </ul>
                </div>

                <ChatInputForm
                    value={inputText}
                    onChange={setInputText}
                    onSubmit={handleMessageInput}
                    disabled={!currentRoom}
                    roomName={currentRoom ? currentRoom.title : ''}
                    typingUsers={typingUsers}
                />
            </div>
        </main>
    );
}