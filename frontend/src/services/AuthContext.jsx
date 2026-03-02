import React, { createContext, useContext, useState, useCallback } from 'react'
import { fetchMemberships } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('mizuka_user')
    return stored ? JSON.parse(stored) : null
  })

  const [token, setToken] = useState(() => localStorage.getItem('mizuka_token') || null)

  const [institutes, setInstitutes] = useState(() => {
    const stored = localStorage.getItem('mizuka_institutes')
    return stored ? JSON.parse(stored) : []
  })

  const [activeInstitute, setActiveInstituteState] = useState(() => {
    const stored = localStorage.getItem('mizuka_active_institute')
    return stored ? JSON.parse(stored) : null
  })

  const [channels, setChannels] = useState(() => {
    const stored = localStorage.getItem('mizuka_channels')
    return stored ? JSON.parse(stored) : {}
  })

  const persistInstitutes = (list) => {
    localStorage.setItem('mizuka_institutes', JSON.stringify(list))
    setInstitutes(list)
  }

  const persistActive = (inst) => {
    localStorage.setItem('mizuka_active_institute', JSON.stringify(inst))
    setActiveInstituteState(inst)
  }

  const persistChannels = (map) => {
    localStorage.setItem('mizuka_channels', JSON.stringify(map))
    setChannels(map)
  }

  const refreshMemberships = useCallback(async (userId) => {
    const res = await fetchMemberships(userId)
    if (Array.isArray(res)) {
      const mapped = res.map(m => ({
        id: m.institute_id || m.id,
        label: m.name || m.institute_name || m.institute_id || m.id,
        role: m.role,
        channels: Array.isArray(m.channels) ? m.channels : []
      }))
      persistInstitutes(mapped)

      const channelMap = {}
      mapped.forEach(inst => {
        if (inst.channels.length > 0) channelMap[inst.id] = inst.channels
      })
      persistChannels(channelMap)

      const stored = localStorage.getItem('mizuka_active_institute')
      const currentActive = stored ? JSON.parse(stored) : null
      if (!currentActive && mapped.length > 0) {
        persistActive(mapped[0])
      } else if (currentActive) {
        const stillExists = mapped.find(i => i.id === currentActive.id)
        if (stillExists) persistActive(stillExists)
        else if (mapped.length > 0) persistActive(mapped[0])
        else persistActive(null)
      }
    }
  }, [])

  async function login(userData, tokenValue) {
    setUser(userData)
    setToken(tokenValue)
    localStorage.setItem('mizuka_user', JSON.stringify(userData))
    localStorage.setItem('mizuka_token', tokenValue)
    await refreshMemberships(userData.id)
  }

  function logout() {
    setUser(null)
    setToken(null)
    setInstitutes([])
    setActiveInstituteState(null)
    setChannels({})
    localStorage.removeItem('mizuka_user')
    localStorage.removeItem('mizuka_token')
    localStorage.removeItem('mizuka_institutes')
    localStorage.removeItem('mizuka_active_institute')
    localStorage.removeItem('mizuka_channels')
  }

  function addInstitute(institute) {
    setInstitutes(prev => {
      const already = prev.find(i => i.id === institute.id)
      if (already) return prev
      const updated = [...prev, institute]
      localStorage.setItem('mizuka_institutes', JSON.stringify(updated))
      return updated
    })
    setActiveInstituteState(prev => {
      if (!prev) {
        localStorage.setItem('mizuka_active_institute', JSON.stringify(institute))
        return institute
      }
      return prev
    })
  }

  function removeInstitute(instituteId) {
    setInstitutes(prev => {
      const updated = prev.filter(i => i.id !== instituteId)
      localStorage.setItem('mizuka_institutes', JSON.stringify(updated))
      if (activeInstitute?.id === instituteId) {
        const next = updated.length > 0 ? updated[0] : null
        localStorage.setItem('mizuka_active_institute', JSON.stringify(next))
        setActiveInstituteState(next)
      }
      return updated
    })
  }

  function setActiveInstitute(institute) {
    persistActive(institute)
  }

  function setInstituteChannels(instituteId, chList) {
    setChannels(prev => {
      const updated = { ...prev, [instituteId]: chList }
      localStorage.setItem('mizuka_channels', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      institutes, activeInstitute, channels,
      login, logout,
      addInstitute, removeInstitute, setActiveInstitute,
      setInstituteChannels, refreshMemberships
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}