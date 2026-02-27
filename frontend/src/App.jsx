import { useState } from 'react'
import { useAuth } from './services/AuthContext'
import LoginPage from './pages/LoginPage'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import './styles/app.css'

function App() {
  const { user, logout } = useAuth()
  const [activeChannel, setActiveChannel] = useState('general')

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        user={user}
        onLogout={logout}
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