import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/AuthContext'
import { linkToInstitute } from '../services/api'
import './InstitutePanel.css'

export default function InstitutePanel({ onClose }) {
  const { user, institutes, activeInstitute, addInstitute, removeInstitute, setActiveInstitute } = useAuth()
  const [adding, setAdding] = useState(false)
  const [newId, setNewId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [leaveTarget, setLeaveTarget] = useState(null)
  const panelRef = useRef(null)
  const firstFocusRef = useRef(null)

  useEffect(() => {
    firstFocusRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleAddSubmit(e) {
    e.preventDefault()
    const trimmedId = newId.trim()
    if (!trimmedId) {
      setAddError('Institute ID is required')
      return
    }
    const already = institutes.find(i => i.id === trimmedId)
    if (already) {
      setAddError('You already belong to this institute')
      return
    }
    setAddLoading(true)
    const res = await linkToInstitute(user.id, trimmedId)
    setAddLoading(false)
    if (res.message && res.message !== 'User deleted') {
      setAddError(res.message)
      return
    }
    addInstitute({ id: trimmedId, label: newLabel.trim() || trimmedId })
    setNewId('')
    setNewLabel('')
    setAdding(false)
  }

  function handleSelect(institute) {
    setActiveInstitute(institute)
    onClose()
  }

  function handleLeaveConfirm() {
    removeInstitute(leaveTarget.id)
    setLeaveTarget(null)
  }

  function resetAddForm() {
    setAdding(false)
    setAddError('')
    setNewId('')
    setNewLabel('')
  }

  return (
    <div
      className="ipanel-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Manage institutes"
    >
      <div className="ipanel" ref={panelRef}>
        <div className="ipanel-header">
          <h2 className="ipanel-title">Institutes</h2>
          <button
            className="ipanel-close"
            onClick={onClose}
            aria-label="Close panel"
            ref={firstFocusRef}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="ipanel-body">
          {institutes.length === 0 ? (
            <p className="ipanel-empty">You haven't joined any institutes yet.</p>
          ) : (
            <ul className="ipanel-list" role="listbox" aria-label="Your institutes">
              {institutes.map(inst => (
                <li key={inst.id} className="ipanel-item">
                  <button
                    className={`ipanel-item-btn ${activeInstitute?.id === inst.id ? 'active' : ''}`}
                    onClick={() => handleSelect(inst)}
                    role="option"
                    aria-selected={activeInstitute?.id === inst.id}
                  >
                    <span className="ipanel-item-icon" aria-hidden="true">
                      {inst.label[0].toUpperCase()}
                    </span>
                    <span className="ipanel-item-info">
                      <span className="ipanel-item-label">{inst.label}</span>
                      {inst.label !== inst.id && (
                        <span className="ipanel-item-id">{inst.id}</span>
                      )}
                    </span>
                    {activeInstitute?.id === inst.id && (
                      <span className="ipanel-active-badge" aria-hidden="true">active</span>
                    )}
                  </button>
                  <button
                    className="ipanel-leave-btn"
                    onClick={() => setLeaveTarget(inst)}
                    aria-label={`Leave ${inst.label}`}
                    title="Leave institute"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!adding ? (
            <button className="ipanel-add-btn" onClick={() => setAdding(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add institute
            </button>
          ) : (
            <form className="ipanel-add-form" onSubmit={handleAddSubmit} noValidate>
              <p className="ipanel-add-heading">Join a new institute</p>
              {addError && <p className="ipanel-add-error" role="alert">{addError}</p>}
              <label className="ipanel-label" htmlFor="new-inst-id">Institute ID</label>
              <input
                id="new-inst-id"
                className="ipanel-input"
                type="text"
                value={newId}
                onChange={e => { setNewId(e.target.value); setAddError('') }}
                placeholder="Paste the UUID here"
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <label className="ipanel-label" htmlFor="new-inst-label">
                Nickname <span className="ipanel-optional">(optional)</span>
              </label>
              <input
                id="new-inst-label"
                className="ipanel-input"
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Springfield High"
                autoComplete="off"
              />
              <div className="ipanel-add-actions">
                <button type="submit" className="ipanel-confirm-btn" disabled={addLoading}>
                  {addLoading ? 'Joining…' : 'Join'}
                </button>
                <button type="button" className="ipanel-cancel-btn" onClick={resetAddForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {leaveTarget && (
        <div className="ipanel-leave-modal" role="alertdialog" aria-modal="true" aria-label="Confirm leaving institute">
          <div className="ipanel-leave-card">
            <p className="ipanel-leave-title">Leave institute?</p>
            <p className="ipanel-leave-sub">
              You'll be removed from <strong>{leaveTarget.label}</strong> and won't see its channels until you rejoin.
              No data will be deleted on the server.
            </p>
            <div className="ipanel-leave-actions">
              <button className="ipanel-leave-confirm" onClick={handleLeaveConfirm}>
                Leave
              </button>
              <button className="ipanel-leave-cancel" onClick={() => setLeaveTarget(null)}>
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}