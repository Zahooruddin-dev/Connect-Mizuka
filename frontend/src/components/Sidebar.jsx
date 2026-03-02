import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { fetchChannelsByInstitute, createChannel } from '../services/api'
import InstitutePanel from './Institutepanel'
import './styles/Sidebar.css'

function Sidebar({ activeChannel, onChannelSelect, user, onLogout, isAdmin }) {
  const { activeInstitute } = useAuth()
  const [panelOpen, setPanelOpen] = useState(false)
  const [channels, setChannels] = useState([])

  useEffect(() => {
    if (activeInstitute) {
      fetchChannelsByInstitute(activeInstitute.id)
        .then(res => setChannels(res.channels || []))
        .catch(() => setChannels([]))
    } else {
      setChannels([])
    }
  }, [activeInstitute])

  // Listen for channel deletions elsewhere in the app and update local list
  useEffect(() => {
    const handler = (e) => {
      const id = e?.detail?.channelId
      if (!id) return
      setChannels(prev => prev.filter(c => String(c.id) !== String(id)))
      // If the deleted channel is currently active, clear selection
      if (String(activeChannel) === String(id) && typeof onChannelSelect === 'function') {
        onChannelSelect(null)
      }
    }

    window.addEventListener('channelDeleted', handler)
    return () => window.removeEventListener('channelDeleted', handler)
  }, [activeChannel, onChannelSelect])

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
          {channels.length > 0 ? (
            <>
              <span className="sidebar-section-label" id="channels-label">Channels</span>
              {isAdmin && (
                <button
                  className="sidebar-add-channel-btn"
                  title="Create channel"
                  onClick={async () => {
                    const name = prompt('New channel name');
                    if (!name) return;
                    const res = await createChannel(user.id, activeInstitute.id, name);
                    if (res.channel) {
                      setChannels(prev => [...prev, res.channel]);
                    } else {
                      alert(res.message || 'Failed to create');
                    }
                  }}
                >+</button>
              )}
              <ul className="sidebar-channels" aria-labelledby="channels-label" role="list">
                {channels.map(ch => (
                  <li key={ch.id} role="listitem">
                    <button
                      className={`sidebar-channel-btn ${activeChannel === ch.id ? 'active' : ''}`}
                      onClick={() => onChannelSelect(ch)}
                      aria-current={activeChannel === ch.id ? 'page' : undefined}
                    >
                      <span className="sidebar-hash" aria-hidden="true">#</span>
                      <span>{ch.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="sidebar-no-channels">
              Select or join an institute to see channels.
            </p>
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
            onClick={onLogout}
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