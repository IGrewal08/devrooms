import React from "react";

/**
 * QuickToolsPanel
 * Renders the DevAgent status card, current room summary preview, and one-click
 * agentic actions ("Summarize room" and "Create Mermaid diagram") in RightPanel.jsx.
 *
 * Props:
 * - agentStatus: Status string under DevAgent (default: "Ready to collaborate")
 * - currentSummary: Short text preview of the room's latest AI summary
 * - onSummarizeRoom: Callback() to trigger AI room summary request
 * - onCreateMermaid: Callback() to trigger AI Mermaid diagram request
 * - isBusy: Boolean to disable buttons while an AI request is in flight
 */
export default function QuickToolsPanel({
    agentStatus = "Ready to collaborate",
    currentSummary = "No room summary generated yet.",
    onSummarizeRoom,
    onCreateMermaid,
    isBusy = false,
}) {
    return (
        <>
            {/* YOUR ROOM AGENT section */}
            <section className="dr-panel-section">
                <div className="dr-section-header">
                    <span className="dr-section-label">YOUR ROOM AGENT</span>
                </div>

                <div className="dr-agent-header-row">
                    <div className="dr-avatar dr-avatar-agent dr-avatar-sm">✦</div>
                    <div>
                        <div className="dr-member-name">DevAgent</div>
                        <div className="dr-member-role">{agentStatus}</div>
                    </div>
                </div>

                <div className="dr-mini-summary-card">
                    <div className="dr-mini-summary-title">Current room summary</div>
                    <p className="dr-mini-summary-text">{currentSummary}</p>
                </div>
            </section>

            {/* QUICK TOOLS section */}
            <section className="dr-panel-section">
                <div className="dr-section-header">
                    <span className="dr-section-label">QUICK TOOLS</span>
                </div>

                <div className="dr-quick-tools-list">
                    <button
                        type="button"
                        className="dr-tool-card"
                        onClick={onSummarizeRoom}
                        disabled={isBusy}
                    >
                        <div>
                            <div className="dr-tool-title">Summarize room</div>
                            <div className="dr-tool-desc">
                                Capture key points and next steps
                            </div>
                        </div>
                        <span className="dr-tool-arrow">&nearr;</span>
                    </button>

                    <button
                        type="button"
                        className="dr-tool-card"
                        onClick={onCreateMermaid}
                        disabled={isBusy}
                    >
                        <div>
                            <div className="dr-tool-title">Create Mermaid diagram</div>
                            <div className="dr-tool-desc">
                                Visualize this room with Mermaid.js
                            </div>
                        </div>
                        <span className="dr-tool-arrow">&nearr;</span>
                    </button>
                </div>
            </section>
        </>
    );
}