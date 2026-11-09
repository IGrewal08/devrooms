import { useState } from 'react';
import './App.css';
import { API_BASE_URL } from './socket';

export default function RightPanel({
    activeUsers,
    currentRoom,
    currentUser,
    issues,
    repoData,
    setRepoData,
    activeModal,
    setActiveModal
}) {
    // Repository File Read/Write State
    const fileKeys = Object.keys(repoData.files || {});
    const [selectedFile, setSelectedFile] = useState(fileKeys[0] || 'frontend/src/ChatArea.jsx');
    const [fileContentDraft, setFileContentDraft] = useState('');

    // Issue / Bug Report Form State (Reused from BugReportForm pattern)
    const [issueTitle, setIssueTitle] = useState('');
    const [issueDesc, setIssueDesc] = useState('');
    const [issueContact, setIssueContact] = useState('');
    const [issueErrors, setIssueErrors] = useState({});
    const [issuePhase, setIssuePhase] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
    const [createdIssueId, setCreatedIssueId] = useState(null);

    const openRepoModal = () => {
        const firstKey = Object.keys(repoData.files || {})[0] || 'frontend/src/ChatArea.jsx';
        setSelectedFile(firstKey);
        setFileContentDraft(repoData.files?.[firstKey]?.content || '');
        setActiveModal('repo');
    };

    const handleWriteFile = async () => {
        const res = await fetch(`${API_BASE_URL}/api/repo/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: selectedFile,
                content: fileContentDraft,
                updatedBy: currentUser?.username,
                roomId: currentRoom?.room_id || 'central'
            })
        });
        if (res.ok) {
            setRepoData((prev) => ({
                ...prev,
                files: {
                    ...prev.files,
                    [selectedFile]: {
                        ...(prev.files[selectedFile] || {}),
                        content: fileContentDraft
                    }
                }
            }));
            setActiveModal(null);
        }
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!issueTitle.trim() || issueTitle.trim().length < 3) {
            errs.title = 'Title is required (min 3 characters).';
        }
        if (!issueDesc.trim() || issueDesc.trim().length < 10) {
            errs.description = 'Description is required (min 10 characters).';
        }
        setIssueErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setIssuePhase('submitting');
        try {
            const res = await fetch(`${API_BASE_URL}/v1/issues`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: issueTitle.trim(),
                    description: issueDesc.trim(),
                    reporterContact: issueContact.trim() || currentUser?.username,
                    roomId: currentRoom?.room_id || 'central'
                })
            });
            if (res.status === 201) {
                const created = await res.json();
                setCreatedIssueId(created.id);
                setIssuePhase('success');
            } else {
                setIssuePhase('error');
            }
        } catch {
            setIssuePhase('error');
        }
    };

    return (
        <aside id="panel" className="rightPanel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. Real-Time Connected Users in Room */}
                <div className="section">
                    <h2>Connected in #{currentRoom?.title || 'Central'} ({activeUsers.length})</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {activeUsers.length > 0 ? (
                            activeUsers.map((u) => (
                                <li
                                    key={u.socketId}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '6px 8px',
                                        background: '#12151e',
                                        borderRadius: '7px',
                                        fontSize: '12.5px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#fff' }}>{u.username || u.name}</div>
                                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{u.role}</div>
                                    </div>
                                    <span style={{ color: '#34d399', fontSize: '10px' }}>● Online</span>
                                </li>
                            ))
                        ) : (
                            <li style={{ fontSize: '12px', color: '#64748b' }}>No active users connected</li>
                        )}
                    </ul>
                </div>

                {/* 2. AI Agent & Capabilities */}
                <div className="section">
                    <h2>@DevAgent Capabilities</h2>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, textAlign: 'left' }}>
                        <p style={{ marginBottom: '8px', color: '#a5b4fc', fontWeight: 600 }}>
                            Scoped to branch: {currentRoom?.branch || 'main'}
                        </p>
                        <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <li><strong>AI Summaries:</strong> Synthesizes room chat logs into decisions.</li>
                            <li><strong>Mermaid.js Diagrams:</strong> Generates editable architecture diagrams from chat.</li>
                            <li><strong>Read/Write Files:</strong> Inspects and updates branch files.</li>
                            <li><strong>PR & Issue Tracking:</strong> Opens PRs (Approve/Deny) & logs issues.</li>
                        </ul>
                    </div>
                </div>

                {/* 3. Quick Agent Tools */}
                <div className="section">
                    <h2>Developer Tools</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button type="button" onClick={openRepoModal} className="actionBtn" style={{ textAlign: 'left' }}>
                            📝 Read & Write Repo Files
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIssuePhase('idle');
                                setIssueTitle('');
                                setIssueDesc('');
                                setActiveModal('issues');
                            }}
                            className="actionBtn"
                            style={{ textAlign: 'left' }}
                        >
                            🐛 Open Issue & Bug Tracker
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal 1: Agent Read & Write Repo Files */}
            {activeModal === 'repo' && (
                <div className="modalOverlay">
                    <div className="modalCard">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h3 style={{ color: '#fff' }}>📁 Working Repository & Active Branches</h3>
                            <button onClick={() => setActiveModal(null)} className="actionBtn">✕</button>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            {Object.keys(repoData.files || {}).map((path) => (
                                <button
                                    key={path}
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(path);
                                        setFileContentDraft(repoData.files[path].content);
                                    }}
                                    className="actionBtn"
                                    style={{
                                        borderColor: selectedFile === path ? '#6366f1' : '#282d3e',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    {path}
                                </button>
                            ))}
                        </div>

                        <div className="formField">
                            <label>Editing: {selectedFile}</label>
                            <textarea
                                rows={9}
                                value={fileContentDraft}
                                onChange={(e) => setFileContentDraft(e.target.value)}
                                style={{ fontFamily: 'monospace', color: '#6ee7b7' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setActiveModal(null)} className="actionBtn">Close</button>
                            <button onClick={handleWriteFile} className="sendBtn">
                                Write Changes to Branch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Issue & Bug Tracker (Adapted from BugReportForm Reference) */}
            {activeModal === 'issues' && (
                <div className="modalOverlay">
                    <div className="modalCard">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h3 style={{ color: '#fff' }}>🐛 DevRooms Issue & PR Criteria Tracker</h3>
                            <button onClick={() => setActiveModal(null)} className="actionBtn">✕</button>
                        </div>

                        {issuePhase === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '18px' }}>
                                <div style={{ fontSize: '32px' }}>🐛</div>
                                <h4 style={{ color: '#6ee7b7', margin: '8px 0' }}>Issue #{createdIssueId} Received!</h4>
                                <p style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '12px' }}>
                                    Added to the Velocity Labs triage queue.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIssueTitle('');
                                        setIssueDesc('');
                                        setIssuePhase('idle');
                                    }}
                                    className="sendBtn"
                                >
                                    Submit Another Issue
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleIssueSubmit} noValidate>
                                {issuePhase === 'error' && (
                                    <div style={{ color: '#fca5a5', fontSize: '12px', marginBottom: '10px' }}>
                                        ⚠️ Couldn't reach the server — your text is preserved so you can try again.
                                    </div>
                                )}

                                <div className="formField">
                                    <label>Issue Title *</label>
                                    <input
                                        type="text"
                                        value={issueTitle}
                                        onChange={(e) => setIssueTitle(e.target.value)}
                                        placeholder="e.g., Add Mermaid.js sequence diagram export"
                                    />
                                    {issueErrors.title && (
                                        <span style={{ color: '#fca5a5', fontSize: '11px' }}>{issueErrors.title}</span>
                                    )}
                                </div>

                                <div className="formField">
                                    <label>Description & Acceptance Criteria *</label>
                                    <textarea
                                        rows={4}
                                        value={issueDesc}
                                        onChange={(e) => setIssueDesc(e.target.value)}
                                        placeholder="Steps to reproduce or PR acceptance criteria..."
                                    />
                                    {issueErrors.description && (
                                        <span style={{ color: '#fca5a5', fontSize: '11px' }}>{issueErrors.description}</span>
                                    )}
                                </div>

                                <div className="formField">
                                    <label>Reporter (Optional)</label>
                                    <input
                                        type="text"
                                        value={issueContact}
                                        onChange={(e) => setIssueContact(e.target.value)}
                                        placeholder={currentUser?.username}
                                    />
                                </div>

                                <button type="submit" className="sendBtn" disabled={issuePhase === 'submitting'}>
                                    {issuePhase === 'submitting' ? 'Sending...' : '🐛 Submit Issue'}
                                </button>
                            </form>
                        )}

                        <hr style={{ borderColor: '#252938', margin: '16px 0' }} />

                        <h4 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textAlign: 'left' }}>
                            Active Issues ({issues.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                            {issues.map((iss) => (
                                <div
                                    key={iss.id}
                                    style={{
                                        background: '#0c0e14',
                                        border: '1px solid #252938',
                                        borderRadius: '8px',
                                        padding: '10px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <strong style={{ color: '#fff' }}>#{iss.id} — {iss.title}</strong>
                                        <span className="betaBadge">{iss.status}</span>
                                    </div>
                                    <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                                        {iss.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}