import './Sidebar.css'

const CHANNELS = [
  { id: 'general', label: 'general' },
  { id: 'design', label: 'design' },
  { id: 'engineering', label: 'engineering' },
  { id: 'random', label: 'random' }
]

function Sidebar({ activeChannel, onChannelSelect, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">
          <span className="sidebar-brand-m">M</span>izuka
        </span>
        <span className="sidebar-status" />
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-label">Channels</span>
        <ul className="sidebar-channels">
          {CHANNELS.map(ch => (
            <li key={ch.id}>
              <button
                className={`sidebar-channel-btn ${activeChannel === ch.id ? 'active' : ''}`}
                onClick={() => onChannelSelect(ch.id)}
              >
                <span className="sidebar-hash">#</span>
                <span>{ch.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.username[0].toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{user.username}</span>
            <span className="sidebar-user-status">online</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={onLogout} title="Logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
