import React, { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { login, register, requestPasswordReset, resetPassword } from '../services/api'
import './LoginPage.css'

const VIEWS = { LOGIN: 'login', REGISTER: 'register', RESET_REQ: 'reset_req', RESET_CONFIRM: 'reset_confirm' }

export default function LoginPage() {
  const { login: authLogin } = useAuth()
  const [view, setView] = useState(VIEWS.LOGIN)
  const [form, setForm] = useState({ email: '', password: '', username: '', role: 'member', institute_id: '', code: '', newPassword: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const res = await login(form.email, form.password)
    setLoading(false)
    if (res.token) {
      authLogin(res.user, res.token)
    } else {
      setError(res.message || 'Login failed')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    const res = await register(form.username, form.email, form.password, form.role, form.institute_id)
    setLoading(false)
    if (res.user) {
      setInfo('Account created! Please log in.')
      setView(VIEWS.LOGIN)
    } else {
      setError(typeof res === 'string' ? res : res.message || 'Registration failed')
    }
  }

  async function handleResetRequest(e) {
    e.preventDefault()
    setLoading(true)
    const res = await requestPasswordReset(form.email)
    setLoading(false)
    setInfo(res.message || 'Check your email for a reset code.')
    setView(VIEWS.RESET_CONFIRM)
  }

  async function handleResetConfirm(e) {
    e.preventDefault()
    setLoading(true)
    const res = await resetPassword(form.email, form.code, form.newPassword)
    setLoading(false)
    if (res.message === 'reset password done') {
      setInfo('Password reset! Please log in.')
      setView(VIEWS.LOGIN)
    } else {
      setError(res.message || 'Reset failed')
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">M</span>
          <span className="login-name">Mizuka</span>
        </div>

        {info && <p className="login-info">{info}</p>}
        {error && <p className="login-error">{error}</p>}

        {view === VIEWS.LOGIN && (
          <form className="login-form" onSubmit={handleLogin}>
            <h2 className="login-heading">Welcome back</h2>
            <label className="login-label">Email</label>
            <input className="login-input" name="email" type="email" value={form.email} onChange={handleChange} required autoFocus />
            <label className="login-label">Password</label>
            <input className="login-input" name="password" type="password" value={form.password} onChange={handleChange} required />
            <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
            <div className="login-links">
              <button type="button" className="login-link" onClick={() => { setError(''); setView(VIEWS.REGISTER) }}>Create account</button>
              <button type="button" className="login-link" onClick={() => { setError(''); setView(VIEWS.RESET_REQ) }}>Forgot password?</button>
            </div>
          </form>
        )}

        {view === VIEWS.REGISTER && (
          <form className="login-form" onSubmit={handleRegister}>
            <h2 className="login-heading">Create account</h2>
            <label className="login-label">Username</label>
            <input className="login-input" name="username" value={form.username} onChange={handleChange} required />
            <label className="login-label">Email</label>
            <input className="login-input" name="email" type="email" value={form.email} onChange={handleChange} required />
            <label className="login-label">Password</label>
            <input className="login-input" name="password" type="password" value={form.password} onChange={handleChange} required />
            <label className="login-label">Institute ID</label>
            <input className="login-input" name="institute_id" value={form.institute_id} onChange={handleChange} required />
            <label className="login-label">Role</label>
            <select className="login-input login-select" name="role" value={form.role} onChange={handleChange}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
            <div className="login-links">
              <button type="button" className="login-link" onClick={() => { setError(''); setView(VIEWS.LOGIN) }}>Back to login</button>
            </div>
          </form>
        )}

        {view === VIEWS.RESET_REQ && (
          <form className="login-form" onSubmit={handleResetRequest}>
            <h2 className="login-heading">Reset password</h2>
            <p className="login-sub">Enter your email and we'll send a reset code.</p>
            <label className="login-label">Email</label>
            <input className="login-input" name="email" type="email" value={form.email} onChange={handleChange} required />
            <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset code'}</button>
            <div className="login-links">
              <button type="button" className="login-link" onClick={() => { setError(''); setView(VIEWS.LOGIN) }}>Back to login</button>
            </div>
          </form>
        )}

        {view === VIEWS.RESET_CONFIRM && (
          <form className="login-form" onSubmit={handleResetConfirm}>
            <h2 className="login-heading">Enter reset code</h2>
            <label className="login-label">Code</label>
            <input className="login-input" name="code" value={form.code} onChange={handleChange} required />
            <label className="login-label">New Password</label>
            <input className="login-input" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} required />
            <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Resetting…' : 'Reset password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
