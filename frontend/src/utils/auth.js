const AUTH_KEY = 'mizuka_auth'

export const getAuth = () => {
  const raw = localStorage.getItem(AUTH_KEY)
  return raw ? JSON.parse(raw) : null
}

export const setAuth = (userId, username) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId, username }))
}

export const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY)
}
