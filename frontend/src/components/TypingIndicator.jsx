import React from 'react'
import './TypingIndicator.css'

export default function TypingIndicator({ username }) {
  if (!username) return null
  return (
    <div className="typing-indicator">
      <span className="typing-avatar">{username[0].toUpperCase()}</span>
      <div className="typing-bubble">
        <span className="typing-name">{username}</span>
        <div className="typing-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
