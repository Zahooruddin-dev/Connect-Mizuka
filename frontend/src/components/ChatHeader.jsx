import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X, Trash2, Hash } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { deleteChannel, updateChannel } from '../services/api'
import socket from '../services/socket'
import './styles/ChatHeader.css'

function ChatHeader({ channelId, channelLabel, instituteId, onChannelDeleted, onChannelRenamed }) {
  const { user } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(channelLabel || '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    setNameInput(channelLabel || '')
  }, [channelLabel])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function handleEditStart() {
    setNameInput(channelLabel || '')
    setError('')
    setEditing(true)
  }

  function handleEditCancel() {
    setEditing(false)
    setNameInput(channelLabel || '')
    setError('')
  }

  async function handleEditSave() {
    const trimmed = nameInput.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
    if (!trimmed) {
      setError('Channel name cannot be empty')
      return
    }
    if (trimmed === channelLabel) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError('')
    const res = await updateChannel(channelId, user.id, { name: trimmed })
    setSaving(false)
    if (res?.channel) {
      setEditing(false)
      socket.emit('channel_renamed', { channel: res.channel, instituteId })
      window.dispatchEvent(new CustomEvent('channelRenamed', { detail: { channel: res.channel } }))
      if (typeof onChannelRenamed === 'function') onChannelRenamed(res.channel)
    } else {
      setError(res?.message || 'Failed to rename channel')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleEditSave()
    if (e.key === 'Escape') handleEditCancel()
  }

  async function handleDeleteChannel() {
    setDeleting(true)
    setError('')
    try {
      const res = await deleteChannel(channelId, user.id)
      if (res?.error) {
        setError(res.error)
        setDeleting(false)
        setShowConfirm(false)
        return
      }
      socket.emit('channel_deleted', { channelId, instituteId })
      window.dispatchEvent(new CustomEvent('channelDeleted', { detail: { channelId } }))
      if (typeof onChannelDeleted === 'function') onChannelDeleted(channelId)
      setDeleting(false)
      setShowConfirm(false)
    } catch {
      setError('Failed to delete channel')
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <Hash className="chat-header-hash" size={18} strokeWidth={2} aria-hidden="true" />

        {editing ? (
          <div className="chat-header-edit">
            <input
              ref={inputRef}
              className="chat-header-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={64}
              disabled={saving}
              aria-label="Channel name"
              spellCheck={false}
            />
            <button
              className="chat-header-icon-btn chat-header-save"
              onClick={handleEditSave}
              disabled={saving}
              aria-label="Save name"
              title="Save"
            >
              <Check size={14} strokeWidth={2.5} />
            </button>
            <button
              className="chat-header-icon-btn chat-header-cancel"
              onClick={handleEditCancel}
              disabled={saving}
              aria-label="Cancel editing"
              title="Cancel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="chat-header-name-wrap">
            <span className="chat-header-name">{channelLabel || channelId}</span>
            {isAdmin && (
              <button
                className="chat-header-icon-btn chat-header-edit-btn"
                onClick={handleEditStart}
                aria-label="Rename channel"
                title="Rename channel"
              >
                <Pencil size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="chat-header-actions">
        {error && <span className="chat-header-error">{error}</span>}
        {isAdmin && !editing && (
          showConfirm ? (
            <div className="delete-confirm">
              <span>Delete channel?</span>
              <button className="confirm-yes" onClick={handleDeleteChannel} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes'}
              </button>
              <button className="confirm-no" onClick={() => setShowConfirm(false)}>No</button>
            </div>
          ) : (
            <button className="channel-delete-btn" onClick={() => setShowConfirm(true)} title="Delete channel">
              <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
              Delete channel
            </button>
          )
        )}
      </div>
    </header>
  )
}

export default ChatHeader