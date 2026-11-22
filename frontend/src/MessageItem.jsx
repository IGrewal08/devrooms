import React from 'react';
import RoomSummaryCard from './RoomSummaryCard';
import MermaidDiagramCard from './MermaidDiagramCard';

/**
 * Generates two-letter initials for a user's circular avatar badge.
 */
function getInitials(name = 'U') {
    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');
}

/**
 * MessageItem
 * Renders an individual chat row matching the DevRooms Figma layout.
 * as well as upcoming DevAgent fields (isAgent, summary, diagram).
 */
export default function MessageItem({ message }) {
    // Normalize existing backend fields alongside future agentic fields
    const senderName = message.senderName || message.username || 'User';
    const content = message.content ?? message.message ?? '';
    const isAgent = Boolean(message.isAgent || message.is_agent);
    const timestamp =
        message.timestamp ||
        (message.created_at
            ? new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })
            : '');

    return (
        <li id="chat" className={`dr-message-row ${isAgent ? 'dr-message-agent' : ''}`}>
            {/* Circular initials avatar for users, rounded square icon for DevAgent */}
            <div className={`dr-avatar ${isAgent ? 'dr-avatar-agent' : ''}`}>
                {isAgent ? '✦' : getInitials(senderName)}
            </div>

            {/* Header metadata, message body, and optional embedded AI cards */}
            <div className="dr-message-body">
                <div className="dr-message-header">
                    <span className="posterHeader dr-sender-name">{senderName}</span>
                    {isAgent && <span className="dr-agent-badge">AGENT</span>}
                    {timestamp && <span className="dr-timestamp">{timestamp}</span>}
                </div>

                {content && <p className="chatContent dr-message-text">{content}</p>}

                {/* Optional DevAgent structured summary card */}
                {message.summary && <RoomSummaryCard {...message.summary} />}

                {/* Optional DevAgent Mermaid.js diagram card */}
                {message.diagram && <MermaidDiagramCard {...message.diagram} />}
            </div>
        </li>
    );
}