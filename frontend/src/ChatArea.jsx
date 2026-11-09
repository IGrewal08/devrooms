import { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import './App.css';
import { socket, API_BASE_URL } from './socket';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'monospace'
});

function MermaidDiagramCard({ code, title, onUpdateCode }) {
    const containerRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draftCode, setDraftCode] = useState(code);
    const [svgOutput, setSvgOutput] = useState('');
    const [renderError, setRenderError] = useState('');

    useEffect(() => {
        setDraftCode(code);
    }, [code]);

    useEffect(() => {
        let isMounted = true;
        const renderDiagram = async () => {
            try {
                setRenderError('');
                const uniqueId = `mermaid-svg-${Math.random().toString(36).slice(2, 9)}`;
                const { svg } = await mermaid.render(uniqueId, draftCode);
                if (isMounted) setSvgOutput(svg);
            } catch (err) {
                if (isMounted) setRenderError('Invalid Mermaid syntax — check diagram code below.');
            }
        };
        renderDiagram();
        return () => {
            isMounted = false;
        };
    }, [draftCode]);

    return (
        <div className="artifactCard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '12.5px', color: '#c7d2fe' }}>
                    📐 {title || 'Mermaid.js System Architecture Diagram'}
                </strong>
                <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="actionBtn"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                    {isEditing ? 'Hide Mermaid Code' : 'Edit Mermaid.js Code'}
                </button>
            </div>

            {renderError ? (
                <div style={{ color: '#fca5a5', fontSize: '12px', padding: '8px' }}>{renderError}</div>
            ) : (
                <div
                    ref={containerRef}
                    className="mermaidContainer"
                    dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
            )}

            {isEditing && (
                <div style={{ marginTop: '10px' }}>
                    <textarea
                        rows={7}
                        value={draftCode}
                        onChange={(e) => setDraftCode(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#08090d',
                            color: '#6ee7b7',
                            border: '1px solid #282d3e',
                            borderRadius: '6px',
                            padding: '8px',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                        }}
                    />
                    {onUpdateCode && (
                        <button
                            type="button"
                            onClick={() => {
                                onUpdateCode(draftCode);
                                setIsEditing(false);
                            }}
                            className="sendBtn"
                            style={{ marginTop: '6px', fontSize: '11.5px', padding: '5px 10px' }}
                        >
                            Broadcast Updated Diagram to Room
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ChatArea({ currentRoom, currentUser, typingUsers, onOpenModal }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [diagramPrompt, setDiagramPrompt] = useState('');
    const [showDiagramPromptModal, setShowDiagramPromptModal] = useState(false);

    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);
    const typingTimerRef = useRef(null);

    const roomId = currentRoom?.room_id || 'central';

    // Fetch room messages when switching rooms & subscribe to Socket.IO messages
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`)
            .then((res) => res.json())
            .then((resData) => setMessages(resData.data || []))
            .catch((err) => console.error(err));

        const handleReceiveMessage = (payload) => {
            if (payload.roomId === roomId) {
                setMessages((prev) => {
                    if (prev.some((m) => m.message_id === payload.message.message_id)) return prev;
                    return [...prev, payload.message];
                });
            }
        };

        const handlePrUpdated = ({ prNumber, status, actionBy }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.prData && m.prData.prNumber === prNumber
                        ? { ...m, prData: { ...m.prData, status, actionBy } }
                        : m
                )
            );
        };

        socket.on('message:receive', handleReceiveMessage);
        socket.on('pr:updated', handlePrUpdated);
        return () => {
            socket.off('message:receive', handleReceiveMessage);
            socket.off('pr:updated', handlePrUpdated);
        };
    }, [roomId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);

        if (val.trim()) {
            socket.emit('typing:start', { roomId, username: currentUser?.username });
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
                socket.emit('typing:stop', { roomId });
            }, 1400);
        } else {
            socket.emit('typing:stop', { roomId });
        }
    };

    // Core Feature: AI Chat Summary
    const handleTriggerSummary = async () => {
        await fetch(`${API_BASE_URL}/api/rooms/${roomId}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestedBy: currentUser?.username })
        });
    };

    // Core Feature: AI Mermaid.js Diagram Generation
    const handleTriggerMermaidDiagram = async (instructions = '', customMermaidCode = null) => {
        await fetch(`${API_BASE_URL}/api/rooms/${roomId}/diagram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instructions, customMermaidCode })
        });
        setShowDiagramPromptModal(false);
        setDiagramPrompt('');
    };

    // Core Feature: PR Approve / Deny
    const handlePrDecision = async (prNumber, decision) => {
        await fetch(`${API_BASE_URL}/api/prs/${prNumber}/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                decision,
                reviewer: currentUser?.username,
                roomId
            })
        });
    };

    // File Attachment Upload
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const attachment = {
                name: file.name,
                size: file.size,
                isImage: file.type.startsWith('image/'),
                dataUrl: ev.target.result
            };
            await fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser?.username,
                    initials: currentUser?.initials,
                    userMessage: `Shared file: ${file.name}`,
                    attachment
                })
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleMessageInput = async (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        // Support chat commands
        if (text === '/summarize') {
            setInputText('');
            handleTriggerSummary();
            return;
        }
        if (text.startsWith('/diagram')) {
            const customInst = text.replace('/diagram', '').trim();
            setInputText('');
            handleTriggerMermaidDiagram(customInst);
            return;
        }

        setInputText('');
        socket.emit('typing:stop', { roomId });

        await fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser?.username,
                initials: currentUser?.initials,
                userMessage: text
            })
        });
    };

    // Core Feature from Report Q2 Table: Search for a message in a room
    const filteredMessages = searchQuery.trim()
        ? messages.filter(
            (m) =>
                m.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : messages;

    return (
        <main id="container">
            {/* Room Header with Search, AI Summary & AI Mermaid Diagram Triggers */}
            <div id="roomHeader">
                <div className="roomHeaderTitleGroup">
                    <div className="roomHeaderTitleRow">
                        <h1>#{currentRoom ? currentRoom.title || currentRoom.name : 'Central'}</h1>
                        <span className="scopeBadge">{currentRoom?.scope || 'SHARED'}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#818cf8' }}>
                            ({currentRoom?.branch || 'main'})
                        </span>
                    </div>
                    <span className="roomSubtext">
                        {currentRoom?.description || 'Real-time collaborative room & AI workspace'}
                    </span>
                </div>

                <div className="headerActions">
                    <input
                        type="text"
                        className="searchInput"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search messages..."
                    />
                    <button
                        type="button"
                        onClick={handleTriggerSummary}
                        className="actionBtn primaryAi"
                        title="Core AI Feature 1: Summarize room chat"
                    >
                        ✨ AI Summarize Chat
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDiagramPromptModal(true)}
                        className="actionBtn primaryAi"
                        title="Core AI Feature 2: Generate Mermaid.js diagram from discussion"
                    >
                        📐 AI Mermaid Diagram
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="actionBtn"
                    >
                        📎 Share File
                    </button>
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                </div>
            </div>

            {/* Chat Log Box */}
            <div id="chatContentBox">
                <div id="chatLogBox">
                    <ul>
                        {filteredMessages.map((msg, index) => (
                            <li
                                key={msg.message_id || index}
                                id="chat"
                                className={msg.isAgent ? 'agentMessage' : ''}
                            >
                                <div className={`avatarCircle ${msg.isAgent ? 'agent' : ''}`}>
                                    {msg.initials || (msg.isAgent ? 'AI' : 'DV')}
                                </div>

                                <div className="messageBody">
                                    <div className="posterHeader">
                                        <span>{msg.username}</span>
                                        {msg.isAgent && <span className="betaBadge">AI AGENT</span>}
                                        <span className="msgTime">{msg.time}</span>
                                    </div>

                                    <div className="chatContent">{msg.message}</div>

                                    {/* AI Feature 1: Conversation Summary Card */}
                                    {msg.artifactType === 'ai-summary' && msg.summaryData && (
                                        <div className="artifactCard">
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px' }}>
                                                📋 Summary of #{msg.summaryData.roomName} ({msg.summaryData.messageCount} messages • Participants: {msg.summaryData.participants})
                                            </div>
                                            <p style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '8px' }}>
                                                {msg.summaryData.overview}
                                            </p>
                                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                                <strong style={{ color: '#e2e8f0' }}>Key Decisions:</strong>
                                                <ul style={{ paddingLeft: '18px', marginTop: '4px' }}>
                                                    {msg.summaryData.decisions.map((d, i) => (
                                                        <li key={i}>{d}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Feature 2: Mermaid.js Architecture Diagram Card */}
                                    {msg.artifactType === 'mermaid-diagram' && msg.mermaidCode && (
                                        <MermaidDiagramCard
                                            code={msg.mermaidCode}
                                            title={msg.diagramTitle}
                                            onUpdateCode={(updatedCode) =>
                                                handleTriggerMermaidDiagram('Updated Mermaid diagram', updatedCode)
                                            }
                                        />
                                    )}

                                    {/* Pull Request Approval / Denial Card */}
                                    {msg.artifactType === 'pull-request' && msg.prData && (
                                        <div className="artifactCard">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ fontSize: '13px', color: '#fff' }}>
                                                    🔀 PR #{msg.prData.prNumber}: {msg.prData.title}
                                                </strong>
                                                <span className="betaBadge">{msg.prData.status}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8', margin: '6px 0' }}>
                                                {msg.prData.sourceBranch} → {msg.prData.targetBranch} (+{msg.prData.additions} -{msg.prData.deletions})
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrDecision(msg.prData.prNumber, 'APPROVED')}
                                                    className="sendBtn"
                                                    style={{ background: '#059669' }}
                                                >
                                                    ✓ Approve PR
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrDecision(msg.prData.prNumber, 'DENIED')}
                                                    className="sendBtn"
                                                    style={{ background: '#e11d48' }}
                                                >
                                                    ✕ Deny PR
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Code Snippet Display */}
                                    {msg.codeSnippet && (
                                        <div className="artifactCard">
                                            <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#a5b4fc', marginBottom: '6px' }}>
                                                📄 {msg.codeSnippet.filename} ({msg.codeSnippet.language})
                                            </div>
                                            <pre style={{ fontSize: '12px', color: '#6ee7b7', overflowX: 'auto' }}>
                                                {msg.codeSnippet.code}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Uploaded File / Image Display */}
                                    {msg.attachment && (
                                        <div className="artifactCard" style={{ maxWidth: '380px' }}>
                                            {msg.attachment.isImage ? (
                                                <img
                                                    src={msg.attachment.dataUrl}
                                                    alt={msg.attachment.name}
                                                    style={{ maxWidth: '100%', borderRadius: '6px', marginBottom: '6px' }}
                                                />
                                            ) : null}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                <span>📎 {msg.attachment.name}</span>
                                                <a
                                                    href={msg.attachment.dataUrl}
                                                    download={msg.attachment.name}
                                                    style={{ color: '#818cf8' }}
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div ref={chatEndRef} />
                </div>

                {/* Real-Time Typing Indicator (Only visible when a user is actively typing) */}
                <div className="typingBanner">
                    {typingUsers.length > 0 ? `••• ${typingUsers.join(' & ')} is typing...` : ''}
                </div>

                {/* Chat Input Form */}
                <form onSubmit={handleMessageInput} id="inputContainer">
                    <button
                        type="button"
                        onClick={() =>
                            setInputText((prev) => (prev.includes('@DevAgent') ? prev : `@DevAgent ${prev}`))
                        }
                        className="actionBtn primaryAi"
                    >
                        @DevAgent
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder={`Message #${currentRoom?.title || 'Central'} or type /summarize, /diagram, or @DevAgent...`}
                    />
                    <button type="submit" className="sendBtn">
                        Send
                    </button>
                </form>
            </div>

            {/* Modal to Customize AI Mermaid.js Diagram Generation */}
            {showDiagramPromptModal && (
                <div className="modalOverlay">
                    <div className="modalCard" style={{ maxWidth: '480px' }}>
                        <h3 style={{ color: '#fff', marginBottom: '8px' }}>
                            📐 Generate Mermaid.js Diagram from Chat
                        </h3>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                            Choose a diagram type or enter custom instructions for @DevAgent:
                        </p>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => handleTriggerMermaidDiagram('System Architecture Flowchart')}
                                className="actionBtn"
                            >
                                System Architecture
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTriggerMermaidDiagram('Sequence Diagram for WebSocket & AI flow')}
                                className="actionBtn"
                            >
                                WebSocket Sequence
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTriggerMermaidDiagram('PostgreSQL Database ER Schema')}
                                className="actionBtn"
                            >
                                Database ER Schema
                            </button>
                        </div>
                        <div className="formField">
                            <label>Custom Instructions</label>
                            <input
                                type="text"
                                value={diagramPrompt}
                                onChange={(e) => setDiagramPrompt(e.target.value)}
                                placeholder="e.g., Include Redis cache or OAuth2 flow..."
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setShowDiagramPromptModal(false)}
                                className="actionBtn"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTriggerMermaidDiagram(diagramPrompt)}
                                className="sendBtn"
                            >
                                Generate Mermaid Diagram
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}