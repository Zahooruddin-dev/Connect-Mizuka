import { useState, useEffect } from 'react'
import { getAuth, clearAuth } from './utils/auth'
import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import './styles/app.css'

function App() {
  const [user, setUser] = useState(null)
  const [activeChannel, setActiveChannel] = useState('general')

  useEffect(() => {
    const saved = getAuth()
    if (saved) setUser(saved)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    clearAuth()
    setUser(null)
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        user={user}
        onLogout={handleLogout}
      />
      <ChatArea
        key={activeChannel}
        channelId={activeChannel}
        user={user}
      />
    </div>
  )
}

export default App