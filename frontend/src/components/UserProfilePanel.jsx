import { useState, useEffect } from 'react'
import { X, User, Mail, Hash, Shield } from 'lucide-react'
import { fetchUserInfo } from '../services/api'
import './styles/UserProfilePanel.css'

function UserProfilePanel({ userId, onClose }) {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    let isMounted = true
    const loadUserInfo = async () => {
      try {
        const data = await fetchUserInfo(userId)
        if (isMounted) {
          setUserInfo(data.user)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadUserInfo()
    return () => {
      isMounted = false
    }
  }, [userId])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="user-panel-overlay" onClick={handleOverlayClick}>
      <div className="user-panel" role="dialog" aria-modal="true">
        <div className="user-panel-header">
          <span className="user-panel-title">User Profile</span>
          <button className="user-panel-close" onClick={onClose} aria-label="Close panel">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="user-panel-tabs">
          <button
            className={`user-panel-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`user-panel-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
        </div>

        <div className="user-panel-body">
          {loading ? (
            <div className="user-panel-loading">
              <div className="sidebar-status" />
              <span>Loading user information...</span>
            </div>
          ) : userInfo ? (
            <>
              {activeTab === 'profile' && (
                <>
                  <div className="user-header-center">
                    <div className="user-avatar-large">
                      {userInfo.username ? userInfo.username[0].toUpperCase() : 'U'}
                    </div>
                    <div className="user-header-name">{userInfo.username}</div>
                    <div className="user-header-role">{userInfo.role || 'Member'}</div>
                  </div>
                  <div className="user-info-group">
                    <span className="user-info-label">Username</span>
                    <span className="user-info-value">{userInfo.username}</span>
                  </div>
                  <div className="user-info-group">
                    <span className="user-info-label">Email</span>
                    <span className="user-info-value">{userInfo.email || 'Not provided'}</span>
                  </div>
                  <div className="user-info-group">
                    <span className="user-info-label">User ID</span>
                    <span className="user-info-value">{userInfo.id}</span>
                  </div>
                     <div className="user-info-group">
                    <span className="user-info-label">User Created at</span>
                    <span className="user-info-value">{userInfo.created_at}</span>
                  </div>
                </>
              )}
              {activeTab === 'account' && (
                <>
                  <div className="user-info-group">
                    <span className="user-info-label">Account Status</span>
                    <span className="user-info-value">Active</span>
                  </div>
                  <div className="user-info-group">
                    <span className="user-info-label">Role</span>
                    <span className="user-info-value">{userInfo.role || 'Member'}</span>
                  </div>
                  <div className="user-info-group">
                    <span className="user-info-label">Permissions</span>
                    <span className="user-info-value">Standard Access</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="user-panel-loading">
              <span>Failed to load user information</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfilePanel