import { useState } from 'react'
import { useAuth } from './services/AuthContext'
import LoginPage from './pages/LoginPage'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import './styles/app.css'

const DEFAULT_CHANNEL = {
  id: 'c1111111-1111-1111-1111-111111111111',
  label: 'main hallway'
}

function App() {
  const { user, logout } = useAuth()
  const [activeChannel, setActiveChannel] = useState(DEFAULT_CHANNEL)

  const handleChannelSelect = (channel) => {
    setActiveChannel(channel)
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeChannel={activeChannel.id}
        onChannelSelect={handleChannelSelect}
        user={user}
        onLogout={logout}
      />
      <ChatArea
        key={activeChannel.id}
        channelId={activeChannel.id}
        channelLabel={activeChannel.label}
        user={user}
      />
    </div>
  )
}

export default App