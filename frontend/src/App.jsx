import { useState, useEffect } from 'react'
import { useAuth } from './services/AuthContext'
import LoginPage from './pages/LoginPage'
import InstituteGate from './components/Institutegate'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import './styles/app.css'

function App() {
  const { user, institutes, activeInstitute } = useAuth()
  const [activeChannel, setActiveChannel] = useState(null)

  useEffect(() => {
    setActiveChannel(null)
  }, [activeInstitute?.id])

  if (!user) return <LoginPage />

  if (institutes.length === 0 || !activeInstitute) return <InstituteGate />

  const instituteChannels = []
  const effectiveChannel = activeChannel

  return (
    <div className="app-layout">
      <Sidebar
        activeChannel={activeChannel?.id ?? null}
        onChannelSelect={setActiveChannel}
        user={user}
      />
      {activeChannel ? (
        <ChatArea
          key={activeChannel.id}
          channelId={activeChannel.id}
          channelLabel={activeChannel.label}
          user={user}
        />
      ) : (
        <div className="app-no-channel">
          <div className="app-no-channel-inner">
            <span className="app-no-channel-hash">#</span>
            <p className="app-no-channel-text">Select a channel to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App