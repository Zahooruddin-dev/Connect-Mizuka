import React, { useState } from 'react'
import { formatTime } from '../utils/dateFormat'
import './MessageBubble.css'

export default function MessageBubble({ message, isOwn, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onDelete(message.id)
    setConfirming(false)
  }

  function handleMouseLeave() {
    setHovered(false)
    setConfirming(false)
  }

  return (
    <div
      className={`bubble-row ${isOwn ? 'bubble-row--own' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {!isOwn && (
        <span className="bubble-avatar">{message.username?.[0]?.toUpperCase()}</span>
      )}

      <div className={`bubble-body ${isOwn ? 'bubble-body--own' : ''}`}>
        {!isOwn && (
          <span className="bubble-username">{message.username}</span>
        )}
        <div className={`bubble ${isOwn ? 'bubble--own' : ''}`}>
          <p className="bubble-text">{message.content}</p>
          <span className="bubble-time">{formatTime(message.created_at || message.createdAt)}</span>
        </div>
      </div>

      {hovered && isOwn && (
        <button
          className={`bubble-delete ${confirming ? 'bubble-delete--confirm' : ''}`}
          onClick={handleDeleteClick}
          title={confirming ? 'Click again to confirm' : 'Delete message'}
        >
          {confirming ? '✓' : '×'}
        </button>
      )}
    </div>
  )
}
