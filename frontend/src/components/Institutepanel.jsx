import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/AuthContext'
import { linkToInstitute, createInstitute } from '../services/api'
import './InstitutePanel.css'

export default function InstitutePanel({ onClose }) {
  const { user, institutes, activeInstitute, addInstitute, removeInstitute, setActiveInstitute, refreshMemberships } = useAuth()
  const [view, setView] = useState('list')
  const [newInstId, setNewInstId] = useState('')
  const [newInstLabel, setNewInstLabel] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [leaveTarget, setLeaveTarget] = useState(null)
  const firstFocusRef = useRef(null)

  useEffect(() => {
    firstFocusRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (leaveTarget) { setLeaveTarget(null); return }
        if (view !== 'list') { setView('list'); return }
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, view, leaveTarget])

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleJoinSubmit(e) {
    e.preventDefault()
    const trimmedId = newInstId.trim()
    if (!trimmedId) { setJoinError('Institute ID is required'); return }
    const already = institutes.find(i => i.id === trimmedId)
    if (already) { setJoinError('You already belong to this institute'); return }
    setJoinLoading(true)
    const res = await linkToInstitute(user.id, trimmedId)
    setJoinLoading(false)
    if (res.error || (res.message && !res.message.toLowerCase().includes('success') && !res.message.toLowerCase().includes('link') && !res.message.toLowerCase().includes('member'))) {
      setJoinError(res.error || res.message || 'Failed to join institute')
      return
    }
    await refreshMemberships(user.id)
    setNewInstId('')
    setNewInstLabel('')
    setView('list')
  }

  async function handleCreateSubmit(e) {
    e.preventDefault()
    const name = createName.trim()
    if (!name) { setCreateError('Institute name is required'); return }
    setCreateLoading(true)
    const res = await createInstitute(user.id, name)
    setCreateLoading(false)
    if (res.institute?.id || res.id) {
      await refreshMemberships(user.id)
      setCreateName('')
      setView('list')
    } else {
      setCreateError(res.message || 'Failed to create institute')
    }
  }

  function handleSelect(institute) {
    setActiveInstitute(institute)
    onClose()
  }

  function handleLeaveConfirm() {
    removeInstitute(leaveTarget.id)
    setLeaveTarget(null)
  }

  function resetJoinForm() {
    setView('list')
    setJoinError('')
    setNewInstId('')
    setNewInstLabel('')
  }

  function resetCreateForm() {
    setView('list')
    setCreateError('')
    setCreateName('')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div
      className="ipanel-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Manage institutes"
    >
      <div className="ipanel">
        <div className="ipanel-header">
          <h2 className="ipanel-title">
            {view === 'join' ? 'Join institute' : view === 'create' ? 'Create institute' : 'Institutes'}
          </h2>
          <button
            className="ipanel-close"
            onClick={view !== 'list' ? () => setView('list') : onClose}
            aria-label={view !== 'list' ? 'Back' : 'Close panel'}
            ref={firstFocusRef}
          >
            {view !== 'list' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        <div className="ipanel-body">
          {view === 'list' && (
            <>
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
                          {inst.role && <span className="ipanel-item-role">{inst.role}</span>}
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

              <div className="ipanel-actions">
                <button className="ipanel-add-btn" onClick={() => setView('join')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Join institute
                </button>
                {isAdmin && (
                  <button className="ipanel-create-btn" onClick={() => setView('create')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    Create institute
                  </button>
                )}
              </div>
            </>
          )}

          {view === 'join' && (
            <form className="ipanel-form" onSubmit={handleJoinSubmit} noValidate>
              <p className="ipanel-form-desc">Enter the Institute ID shared by your admin.</p>
              {joinError && <p className="ipanel-add-error" role="alert">{joinError}</p>}
              <label className="ipanel-label" htmlFor="join-inst-id">Institute ID</label>
              <input
                id="join-inst-id"
                className="ipanel-input"
                type="text"
                value={newInstId}
                onChange={e => { setNewInstId(e.target.value); setJoinError('') }}
                placeholder="Paste the UUID here"
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <label className="ipanel-label" htmlFor="join-inst-label">
                Nickname <span className="ipanel-optional">(optional)</span>
              </label>
              <input
                id="join-inst-label"
                className="ipanel-input"
                type="text"
                value={newInstLabel}
                onChange={e => setNewInstLabel(e.target.value)}
                placeholder="e.g. Springfield High"
                autoComplete="off"
              />
              <div className="ipanel-add-actions">
                <button type="submit" className="ipanel-confirm-btn" disabled={joinLoading}>
                  {joinLoading ? 'Joining…' : 'Join'}
                </button>
                <button type="button" className="ipanel-cancel-btn" onClick={resetJoinForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {view === 'create' && (
            <form className="ipanel-form" onSubmit={handleCreateSubmit} noValidate>
              <p className="ipanel-form-desc">Create a new institute. A general channel will be created automatically.</p>
              {createError && <p className="ipanel-add-error" role="alert">{createError}</p>}
              <label className="ipanel-label" htmlFor="create-inst-name">Institute name</label>
              <input
                id="create-inst-name"
                className="ipanel-input"
                type="text"
                value={createName}
                onChange={e => { setCreateName(e.target.value); setCreateError('') }}
                placeholder="e.g. Springfield High"
                required
                autoFocus
                autoComplete="off"
              />
              <div className="ipanel-add-actions">
                <button type="submit" className="ipanel-confirm-btn" disabled={createLoading}>
                  {createLoading ? 'Creating…' : 'Create'}
                </button>
                <button type="button" className="ipanel-cancel-btn" onClick={resetCreateForm}>
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
              <button className="ipanel-leave-confirm" onClick={handleLeaveConfirm}>Leave</button>
              <button className="ipanel-leave-cancel" onClick={() => setLeaveTarget(null)}>Keep it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}