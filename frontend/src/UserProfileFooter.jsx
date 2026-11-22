import React from "react";

/**
 * Helper to generate initials for the bottom-left user avatar.
 */
function getInitials(name = "U") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
}

/**
 * UserProfileFooter
 * Displays the DevRooms tagline and authenticated user status at the bottom of Sidebar.jsx.
 *
 * Props:
 * - user: { username: string, status?: string } (populated from GET /users/me)
 * - onOpenSettings: Callback triggered when clicking the settings/auth icon
 */
export default function UserProfileFooter({
    user = { username: "Guest", status: "Online" },
    onOpenSettings,
}) {
    return (
        <div className="dr-sidebar-footer">
            {/* Subtle product tagline above the divider */}
            <div className="dr-tagline">
                <div>One project. Focused rooms.</div>
                <div>Build together, without the noise.</div>
            </div>

            {/* Logged-in user profile row */}
            <div className="dr-user-row">
                <div className="dr-user-info">
                    <div className="dr-avatar dr-avatar-sm">
                        {getInitials(user.username)}
                    </div>
                    <div>
                        <div className="dr-user-name">{user.username}</div>
                        <div className="dr-user-status">
                            <span className="dr-online-dot" /> {user.status || "Online"}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="dr-icon-btn"
                    title="Account & preferences"
                    onClick={onOpenSettings}
                >
                    ⚙
                </button>
            </div>
        </div>
    );
}