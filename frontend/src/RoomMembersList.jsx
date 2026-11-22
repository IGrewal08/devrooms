import React from 'react';

/**
 * Derives initials from either a string or user object name.
 */
function getInitials(name = '?') {
    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');
}

/**
 * RoomMembersList
 * Displays users currently in the active room inside RightPanel.jsx.
 * Supports existing { id, name } objects, string entries, and future { id, username } payloads.
 */
export default function RoomMembersList({ members = [], onInvite }) {
    const onlineCount = members.filter((m) => m?.online !== false).length;

    return (
        <section className="dr-panel-section">
            <div className="dr-section-header">
                <span className="dr-section-label">IN THIS ROOM</span>
                <span className="dr-section-count">{onlineCount} online</span>
            </div>

            <div className="dr-member-list">
                {members.length > 0 ? (
                    members.map((member, index) => {
                        const displayName =
                            typeof member === 'string'
                                ? member
                                : member.name || member.username || 'User';
                        const roleLabel =
                            typeof member === 'object' && member.subtitle
                                ? member.subtitle
                                : 'Room member';
                        const isOnline =
                            typeof member === 'object' ? member.online !== false : true;

                        return (
                            <div
                                key={member?.id || index}
                                className="dr-member-row"
                            >
                                <div className="dr-member-left">
                                    <div className="dr-avatar dr-avatar-sm">
                                        {getInitials(displayName)}
                                    </div>
                                    <div>
                                        <div className="dr-member-name">{displayName}</div>
                                        <div className="dr-member-role">{roleLabel}</div>
                                    </div>
                                </div>
                                <span
                                    className={`dr-presence-dot ${isOnline ? 'is-online' : ''}`}
                                    title={isOnline ? 'Online' : 'Offline'}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div className="dr-member-role">No active users</div>
                )}
            </div>

            <button type="button" className="dr-invite-btn" onClick={onInvite}>
                + Invite to room
            </button>
        </section>
    );
}