import { useState, useEffect, useRef } from 'react'
import { X, Hash, Loader } from 'lucide-react'
import './styles/CreateChannelModal.css'

export default function CreateChannelModal({ onClose, onConfirm }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  function sanitize(val) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
  }

  function handleChange(e) {
    setName(sanitize(e.target.value))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Channel name is required')
      return
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    setLoading(true)
    const result = await onConfirm(trimmed)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <div
      className="ccm-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ccm-title"
    >
      <div className="ccm-card">
        <div className="ccm-header">
          <h2 className="ccm-title" id="ccm-title">Create a channel</h2>
          <button
            className="ccm-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <p className="ccm-desc">
          Channels are where your team communicates. Give it a short, clear name.
        </p>

        <form className="ccm-form" onSubmit={handleSubmit} noValidate>
          <label className="ccm-label" htmlFor="ccm-name">Channel name</label>
          <div className="ccm-input-wrap">
            <Hash size={14} strokeWidth={2} className="ccm-input-icon" aria-hidden="true" />
            <input
              id="ccm-name"
              ref={inputRef}
              className="ccm-input"
              type="text"
              value={name}
              onChange={handleChange}
              placeholder="e.g. announcements"
              autoComplete="off"
              spellCheck={false}
              maxLength={64}
              disabled={loading}
            />
          </div>
          {error && (
            <p className="ccm-error" role="alert">{error}</p>
          )}
          <p className="ccm-hint">Lowercase letters, numbers, hyphens and underscores only.</p>

          <div className="ccm-actions">
            <button
              type="button"
              className="ccm-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ccm-submit"
              disabled={loading || !name.trim()}
            >
              {loading
                ? <><Loader size={13} className="ccm-spinner" /> Creating…</>
                : 'Create channel'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
