import { useState } from 'react'
import { setAuth } from '../utils/auth'
import './styles/LoginScreen.css'

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Enter a username to continue')
      return
    }
    const userId = `user_${Date.now()}`
    setAuth(userId, trimmed)
    onLogin({ userId, username: trimmed })
  }

  return (
    <div className="login-screen">
      <div className="login-glow" />
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-mark">M</span>
          <span className="login-logo-text">izuka</span>
        </div>
        <p className="login-tagline">Real-time. Minimal. Yours.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username">Choose a username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder="e.g. sakura, hiroshi..."
              autoFocus
              maxLength={32}
            />
            {error && <span className="login-error">{error}</span>}
          </div>
          <button type="submit" className="login-btn">
            Enter Mizuka
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginScreen
