import React from 'react';

/**
 * ChatInputForm
 * Controlled chat composer matching the Figma design.
 * Keeps input state and POST logic inside ChatArea.jsx while adding
 * the typing indicator, @DevAgent trigger button, and Enter/Shift+Enter shortcuts.
 */
export default function ChatInputForm({
    value,
    onChange,
    onSubmit,
    disabled = false,
    roomName = '',
    typingUsers = [],
}) {
    // Enter submits the form; Shift+Enter inserts a newline
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && value.trim()) {
                onSubmit(e);
            }
        }
    };

    // Prefill @DevAgent mention in the existing inputText state
    const handleInsertAgentMention = () => {
        if (!value.includes('@DevAgent')) {
            onChange(`@DevAgent ${value}`.trimStart());
        }
    };

    const typingLabel =
        typingUsers.length > 0 ? `${typingUsers.join(', ')} is typing...` : '';

    return (
        <div className="dr-composer-wrapper">
            {/* Live typing indicator (ready for Socket.io events) */}
            <div className="dr-typing-indicator">
                {typingLabel ? `••• ${typingLabel}` : '\u00A0'}
            </div>

            {/* Preserves #inputContainer ID while applying Figma composer styling */}
            <form onSubmit={onSubmit} id="inputContainer" className="dr-composer-box">
                <textarea
                    className="dr-composer-input"
                    rows={1}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        roomName
                            ? `Message ${roomName} or ask @DevAgent...`
                            : 'Select a room first'
                    }
                    disabled={disabled}
                />

                <div className="dr-composer-toolbar">
                    <div className="dr-composer-actions">
                        <button
                            type="button"
                            className="dr-icon-btn"
                            title="Attach context"
                            disabled={disabled}
                        >
                            +
                        </button>
                        <button
                            type="button"
                            className="dr-icon-btn"
                            title="Mention teammate"
                            disabled={disabled}
                            onClick={() => onChange(`${value}@`)}
                        >
                            @
                        </button>
                        <button
                            type="button"
                            className="dr-agent-pill-btn"
                            disabled={disabled}
                            onClick={handleInsertAgentMention}
                        >
                            ✦ DevAgent
                        </button>
                    </div>

                    <div className="dr-composer-submit-group">
                        <span className="dr-shortcut-hint">
                            &crarr; send &middot; &uArr;&crarr; new line
                        </span>
                        <button
                            type="submit"
                            className="dr-send-btn"
                            disabled={disabled || !value.trim()}
                            aria-label="Send message"
                        >
                            &uarr;
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}