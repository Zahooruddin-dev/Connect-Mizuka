import { useState } from 'react'
import { deleteChannel } from '../services/api'
import './ChatHeader.css'

function ChatHeader({ channelId, onChannelDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteChannel = async () => {
    setDeleting(true)
    try {
      await deleteChannel(channelId)
      onChannelDeleted(channelId)
    } catch {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <span className="chat-header-hash">#</span>
        <span className="chat-header-name">{channelId}</span>
      </div>
      <div className="chat-header-actions">
        {showConfirm ? (
          <div className="delete-confirm">
            <span>Delete channel?</span>
            <button
              className="confirm-yes"
              onClick={handleDeleteChannel}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Yes'}
            </button>
            <button className="confirm-no" onClick={() => setShowConfirm(false)}>
              No
            </button>
          </div>
        ) : (
          <button
            className="channel-delete-btn"
            onClick={() => setShowConfirm(true)}
            title="Delete channel"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
              <path d="M10,11v6M14,11v6"/>
              <path d="M9,6V4h6v2"/>
            </svg>
            Delete channel
          </button>
        )}
      </div>
    </header>
  )
}

export default ChatHeader
