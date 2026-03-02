import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { fetchInstituteDashboard, createChannel } from '../services/api'
import InstitutePanel from './Institutepanel'
import './Sidebar.css'

function Sidebar({ activeChannel, onChannelSelect }) {
  const { user, activeInstitute, channels, setInstituteChannels, logout } = useAuth()
  const [panelOpen, setPanelOpen] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  const isAdmin = user?.role === 'admin'
  const instituteChannels = activeInstitute ? (channels[activeInstitute.id] || []) : []

  useEffect(() => {
    if (!activeInstitute || !user) return
    if (channels[activeInstitute.id]?.length > 0) return

    fetchInstituteDashboard(user.id).then(data => {
      if (!Array.isArray(data)) return
      data.forEach(inst => {
        const instId = inst.institute_id || inst.id
        if (instId !== activeInstitute.id) return
        const chList = Array.isArray(inst.channels) ? inst.channels.map(c => ({
          id: c.id,
          label: c.name || c.label || c.id
        })) : []
        setInstituteChannels(activeInstitute.id, chList)
      })
    })
  }, [activeInstitute?.id])

  async function handleCreateChannel(e) {
    e.preventDefault()
    const name = newChannelName.trim()
    if (!name) return
    setCreateLoading(true)
    setCreateError('')
    const res = await createChannel(user.id, activeInstitute.id, name)
    setCreateLoading(false)
    if (res.id || res.channel?.id) {
      const raw = res.channel || res
      const updated = [...instituteChannels, { id: raw.id, label: raw.name || name }]
      setInstituteChannels(activeInstitute.id, updated)
      setNewChannelName('')
      setShowCreateChannel(false)
    } else {
      setCreateError(res.message || 'Failed to create channel')
    }
  }

  function cancelCreateChannel() {
    setShowCreateChannel(false)
    setNewChannelName('')
    setCreateError('')
  }

  return (
    <>
      <aside className="sidebar" aria-label="Navigation">
        <div className="sidebar-header">
          <span className="sidebar-brand" aria-label="Mizuka">
            <span className="sidebar-brand-m" aria-hidden="true">M</span>izuka
          </span>
          <span className="sidebar-status" aria-hidden="true" />
        </div>

        <button
          className="sidebar-institute-btn"
          onClick={() => setPanelOpen(true)}
          aria-label="Manage institutes"
          aria-haspopup="dialog"
        >
          <span className="sidebar-institute-icon" aria-hidden="true">
            {activeInstitute ? activeInstitute.label[0].toUpperCase() : '+'}
          </span>
          <span className="sidebar-institute-info">
            <span className="sidebar-institute-label">
              {activeInstitute ? activeInstitute.label : 'No institute'}
            </span>
            <span className="sidebar-institute-hint">click to manage</span>
          </span>
          <svg className="sidebar-institute-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className="sidebar-section">
          {activeInstitute ? (
            <>
              <div className="sidebar-section-header">
                <span className="sidebar-section-label" id="channels-label">Channels</span>
                {isAdmin && (
                  <button
                    className="sidebar-add-channel-btn"
                    onClick={() => setShowCreateChannel(v => !v)}
                    aria-label="Create new channel"
                    title="Create channel"
                    aria-expanded={showCreateChannel}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                )}
              </div>

              {showCreateChannel && (
                <form className="sidebar-create-channel" onSubmit={handleCreateChannel} noValidate>
                  {createError && <p className="sidebar-create-error" role="alert">{createError}</p>}
                  <input
                    className="sidebar-create-input"
                    type="text"
                    value={newChannelName}
                    onChange={e => { setNewChannelName(e.target.value); setCreateError('') }}
                    placeholder="channel-name"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="New channel name"
                  />
                  <div className="sidebar-create-actions">
                    <button
                      type="submit"
                      className="sidebar-create-confirm"
                      disabled={createLoading || !newChannelName.trim()}
                    >
                      {createLoading ? '…' : 'Create'}
                    </button>
                    <button type="button" className="sidebar-create-cancel" onClick={cancelCreateChannel}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {instituteChannels.length > 0 ? (
                <ul className="sidebar-channels" aria-labelledby="channels-label" role="list">
                  {instituteChannels.map(ch => (
                    <li key={ch.id} role="listitem">
                      <button
                        className={`sidebar-channel-btn ${activeChannel === ch.id ? 'active' : ''}`}
                        onClick={() => onChannelSelect(ch)}
                        aria-current={activeChannel === ch.id ? 'page' : undefined}
                      >
                        <span className="sidebar-hash" aria-hidden="true">#</span>
                        <span>{ch.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sidebar-no-channels">No channels yet.</p>
              )}
            </>
          ) : (
            <p className="sidebar-no-channels">Select or join an institute to see channels.</p>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">
              {user.username[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">{user.username}</span>
              <span className="sidebar-user-role">{user.role || 'member'}</span>
            </div>
          </div>
          <button
            className="sidebar-logout"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {panelOpen && <InstitutePanel onClose={() => setPanelOpen(false)} />}
    </>
  )
}

export default Sidebar