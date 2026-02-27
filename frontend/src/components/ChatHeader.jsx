import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { deleteChannel } from '../services/api'
import './ChatHeader.css'

function ChatHeader({ channelId, channelLabel, onChannelDeleted }) {
  const { user } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'admin'

  const handleDeleteChannel = async () => {
    setDeleting(true)
    setError('')
    try {
      const res = await deleteChannel(channelId, user.id)
      if (res.data?.error) {
        setError(res.data.error)
        setDeleting(false)
        setShowConfirm(false)
        return
      }
      onChannelDeleted(channelId)
    } catch {
      setError('Failed to delete channel')
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <span className="chat-header-hash">#</span>
        <span className="chat-header-name">{channelLabel || channelId}</span>
      </div>
      <div className="chat-header-actions">
        {error && <span className="chat-header-error">{error}</span>}
        {isAdmin && (
          showConfirm ? (
            <div className="delete-confirm">
              <span>Delete all messages?</span>
              <button className="confirm-yes" onClick={handleDeleteChannel} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes'}
              </button>
              <button className="confirm-no" onClick={() => setShowConfirm(false)}>No</button>
            </div>
          ) : (
            <button className="channel-delete-btn" onClick={() => setShowConfirm(true)} title="Delete channel">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
                <path d="M10,11v6M14,11v6"/>
                <path d="M9,6V4h6v2"/>
              </svg>
              Delete channel
            </button>
          )
        )}
      </div>
    </header>
  )
}

export default ChatHeader