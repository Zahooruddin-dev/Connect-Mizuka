import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { createInstitute, linkToInstitute } from '../services/api'
import './styles/InstituteGate.css'

export default function InstituteGate() {
  const { user, logout, addInstitute, isActiveAdmin } = useAuth()
  const isAdminUser = user?.role === 'admin'
  const [instituteId, setInstituteId] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [instName, setInstName] = useState('')
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  async function handleJoin(e) {
    e.preventDefault()
    const trimmedId = instituteId.trim()
    const trimmedLabel = label.trim()
    if (!trimmedId) {
      setError('Institute ID is required')
      return
    }
    setLoading(true)
    const res = await linkToInstitute(user.id, trimmedId)
    setLoading(false)
    if (res.message && res.message !== 'Linked to institute') {
      setError(res.message)
      return
    }
    addInstitute({
      id: res.membership.institute_id,
      label: trimmedLabel || trimmedId,
      role: res.membership.role || 'member',
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!instName.trim()) {
      setCreateError('Name is required')
      return
    }
    setCreateLoading(true)
    const res = await createInstitute(user.id, instName.trim())
    setCreateLoading(false)
    if (res.institute && res.membership) {
      addInstitute({ id: res.institute.id, label: res.institute.name, role: 'admin' })
      setInstName('')
      setCreateError('')
    } else {
      setCreateError(res.message || 'Failed to create institute')
    }
  }

  return (
    <div className="gate-shell">
      <div className="gate-glow" aria-hidden="true" />
      <div className="gate-card">
        <div className="gate-brand">
          <span className="gate-brand-m">M</span>
          <span className="gate-brand-text">izuka</span>
        </div>

        <div className="gate-welcome">
          <div className="gate-avatar" aria-hidden="true">
            {user.username[0].toUpperCase()}
          </div>
          <p className="gate-greeting">Hey, <strong>{user.username}</strong></p>
          <p className="gate-sub">
            You're not part of any institute yet. Enter an Institute ID to join one and start chatting.
          </p>
        </div>

        {error && <p className="gate-error" role="alert">{error}</p>}

        <form className="gate-form" onSubmit={handleJoin} noValidate>
          <label className="gate-label" htmlFor="gate-institute-id">Institute ID</label>
          <input
            id="gate-institute-id"
            className="gate-input"
            type="text"
            value={instituteId}
            onChange={e => { setInstituteId(e.target.value); setError('') }}
            placeholder="e.g. 1c8fb7e7-5e07-409d-…"
            required
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          <label className="gate-label" htmlFor="gate-label">Nickname <span className="gate-optional">(optional)</span></label>
          <input
            id="gate-label"
            className="gate-input"
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Bonaventure high school"
            autoComplete="off"
          />
          <button className="gate-btn" type="submit" disabled={loading}>
            {loading ? 'Joining…' : 'Join institute'}
          </button>
        </form>
        {(isAdminUser || isActiveAdmin()) && (
          <div className="gate-create-sep">
            <hr />
            <p>Create your first institute</p>
            {createError && <p className="gate-error" role="alert">{createError}</p>}
            <form className="gate-form" onSubmit={handleCreate} noValidate>
              <label className="gate-label" htmlFor="gate-inst-name">Institute Name</label>
              <input
                id="gate-inst-name"
                className="gate-input"
                type="text"
                value={instName}
                onChange={e => { setInstName(e.target.value); setCreateError('') }}
                placeholder="e.g. Pinecrest High"
                required
                autoComplete="off"
              />
              <button className="gate-btn" type="submit" disabled={createLoading}>
                {createLoading ? 'Creating…' : 'Create institute'}
              </button>
            </form>
          </div>
        )}

        <div className="gate-footer">
          <button className="gate-logout-link" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}