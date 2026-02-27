import { useState } from 'react'
import { formatTime } from '../utils/time'
import { deleteMessage } from '../services/api'
import './MessageItem.css'

function MessageItem({ message, currentUserId, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const isMine = message.userId === currentUserId

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteMessage(message._id || message.id)
      onDeleted(message._id || message.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className={`message-item ${isMine ? 'mine' : 'theirs'}`}>
      {!isMine && (
        <div className="message-avatar">
          {message.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="message-content">
        {!isMine && (
          <span className="message-author">{message.username}</span>
        )}
        <div className="message-bubble-wrap">
          <div className="message-bubble">
            <p className="message-text">{message.content}</p>
          </div>
          <button
            className={`message-delete ${deleting ? 'deleting' : ''}`}
            onClick={handleDelete}
            title="Delete message"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
              <path d="M10,11v6M14,11v6"/>
              <path d="M9,6V4h6v2"/>
            </svg>
          </button>
        </div>
        <span className="message-time">{formatTime(message.createdAt || message.timestamp || Date.now())}</span>
      </div>
      {isMine && (
        <div className="message-avatar mine-avatar">
          {message.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  )
}

export default MessageItem
