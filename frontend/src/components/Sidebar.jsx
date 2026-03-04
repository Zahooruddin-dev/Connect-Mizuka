import { useState, useEffect } from 'react'
import { Hash, Plus, LogOut, ChevronDown, X, Building2 } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { fetchChannelsByInstitute, createChannel } from '../services/api'
import socket from '../services/socket'
import InstitutePanel from './Institutepanel'
import CreateChannelModal from './CreateChannelModal'
import UserProfilePanel from './UserProfilePanel'
import './styles/Sidebar.css'

function Sidebar({ activeChannel, onChannelSelect, user, onLogout, isAdmin, onClose, isOpen }) {
  const { activeInstitute } = useAuth()
  const [panelOpen, setPanelOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
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

  useEffect(() => {
    const handleSocketDeleted = ({ channelId }) => {
      if (!channelId) return
      setChannels(prev => prev.filter(c => String(c.id) !== String(channelId)))
      if (String(activeChannel) === String(channelId) && typeof onChannelSelect === 'function') {
        onChannelSelect(null)
      }
    }

    const handleSocketRenamed = ({ channel }) => {
      if (!channel?.id) return
      setChannels(prev =>
        prev.map(c => String(c.id) === String(channel.id) ? { ...c, name: channel.name } : c)
      )
    }

    const handleWindowDeleted = (e) => {
      const channelId = e?.detail?.channelId
      if (!channelId) return
      setChannels(prev => prev.filter(c => String(c.id) !== String(channelId)))
      if (String(activeChannel) === String(channelId) && typeof onChannelSelect === 'function') {
        onChannelSelect(null)
      }
    }

    const handleWindowRenamed = (e) => {
      const channel = e?.detail?.channel
      if (!channel?.id) return
      setChannels(prev =>
        prev.map(c => String(c.id) === String(channel.id) ? { ...c, name: channel.name } : c)
      )
    }

    socket.on('channel_deleted', handleSocketDeleted)
    socket.on('channel_renamed', handleSocketRenamed)
    window.addEventListener('channelDeleted', handleWindowDeleted)
    window.addEventListener('channelRenamed', handleWindowRenamed)

    return () => {
      socket.off('channel_deleted', handleSocketDeleted)
      socket.off('channel_renamed', handleSocketRenamed)
      window.removeEventListener('channelDeleted', handleWindowDeleted)
      window.removeEventListener('channelRenamed', handleWindowRenamed)
    }
  }, [activeChannel, onChannelSelect])

  async function handleCreateChannel(name) {
    const res = await createChannel(user.id, activeInstitute.id, name)
    if (res.channel) {
      setChannels(prev => [...prev, res.channel])
      return {}
    }
    return { error: res.message || 'Failed to create channel' }
  }

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`} aria-label="Navigation">
        <div className="sidebar-header">
          <div className="sidebar-brand-wrap">
            <span className="sidebar-brand" aria-label="Mizuka">
              <span className="sidebar-brand-m" aria-hidden="true">M</span>izuka
            </span>
            <span className="sidebar-status" aria-hidden="true" />
          </div>
          {onClose && (
            <button
              className="sidebar-icon-btn sidebar-close-btn"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <button
          className="sidebar-institute-btn"
          onClick={() => setPanelOpen(true)}
          aria-label="Manage institutes"
          aria-haspopup="dialog"
        >
          <span className="sidebar-institute-icon" aria-hidden="true">
            {activeInstitute
              ? activeInstitute.label[0].toUpperCase()
              : <Building2 size={14} />}
          </span>
          <span className="sidebar-institute-info">
            <span className="sidebar-institute-label">
              {activeInstitute ? activeInstitute.label : 'No institute'}
            </span>
            <span className="sidebar-institute-hint">click to manage</span>
          </span>
          <ChevronDown
            className="sidebar-institute-chevron"
            size={14}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        <div className="sidebar-section">
          {channels.length > 0 ? (
            <>
              <div className="sidebar-section-header">
                <span className="sidebar-section-label" id="channels-label">Channels</span>
                {isAdmin && (
                  <button
                    className="sidebar-add-channel-btn"
                    title="Create channel"
                    aria-label="Create channel"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <ul className="sidebar-channels" aria-labelledby="channels-label" role="list">
                {channels.map(ch => (
                  <li key={ch.id} role="listitem">
                    <button
                      className={`sidebar-channel-btn${activeChannel === ch.id ? ' active' : ''}`}
                      onClick={() => onChannelSelect(ch)}
                      aria-current={activeChannel === ch.id ? 'page' : undefined}
                    >
                      <Hash
                        className="sidebar-hash"
                        size={14}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span>{ch.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="sidebar-empty">
              <Building2
                size={30}
                strokeWidth={1}
                className="sidebar-empty-icon"
                aria-hidden="true"
              />
              <p className="sidebar-no-channels">
                Select or join an institute to see channels.
              </p>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            onClick={() => setIsProfileOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsProfileOpen(true) }}
          >
            <div className="sidebar-avatar" aria-hidden="true">
              {user.username[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">{user.username}</span>
              <span className="sidebar-user-role">{user.role || 'member'}</span>
            </div>
          </div>
          <button
            className="sidebar-icon-btn sidebar-logout"
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {panelOpen && (
        <InstitutePanel onClose={() => setPanelOpen(false)} />
      )}

      {createModalOpen && (
        <CreateChannelModal
          onClose={() => setCreateModalOpen(false)}
          onConfirm={handleCreateChannel}
        />
      )}

      {isProfileOpen && (
        <UserProfilePanel
          userId={user.id}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar