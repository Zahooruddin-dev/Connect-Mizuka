import { useState, useEffect, useCallback } from 'react'
import socket from '../services/socket'
import { fetchMessages } from '../services/api'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import './ChatArea.css'

function ChatArea({ channelId, user }) {
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setMessages([])
    setTypingUsers([])

    socket.emit('join_institute', { channelId })

    fetchMessages(channelId)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.messages || []
        setMessages(data)
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))

    const handleReceive = (msg) => {
      setMessages(prev => [...prev, msg])
    }

    const handleDisplayTyping = ({ username }) => {
      setTypingUsers(prev =>
        prev.includes(username) ? prev : [...prev, username]
      )
    }

    const handleStopTyping = ({ username }) => {
      setTypingUsers(prev => prev.filter(u => u !== username))
    }

    socket.on('receive_message', handleReceive)
    socket.on('Display_typing', handleDisplayTyping)
    socket.on('stop_typing', handleStopTyping)

    return () => {
      socket.off('receive_message', handleReceive)
      socket.off('Display_typing', handleDisplayTyping)
      socket.off('stop_typing', handleStopTyping)
    }
  }, [channelId])

  const handleSend = useCallback((content) => {
    socket.emit('send_message', {
      channelId,
      content,
      userId: user.userId,
      username: user.username
    })
  }, [channelId, user])

  const handleTyping = useCallback(() => {
    socket.emit('typing', {
      channelId,
      username: user.username
    })
  }, [channelId, user])

  const handleStopTyping = useCallback(() => {
    socket.emit('stop_typing', {
      channelId,
      username: user.username
    })
  }, [channelId, user])

  const handleMessageDeleted = useCallback((id) => {
    setMessages(prev => prev.filter(m => (m._id || m.id) !== id))
  }, [])

  const handleChannelDeleted = useCallback(() => {
    setMessages([])
  }, [])

  return (
    <div className="chat-area">
      <ChatHeader channelId={channelId} onChannelDeleted={handleChannelDeleted} />
      {loading ? (
        <div className="chat-loading">
          <div className="chat-loading-dots">
            <span /><span /><span />
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          typingUsers={typingUsers.filter(u => u !== user.username)}
          currentUserId={user.userId}
          onMessageDeleted={handleMessageDeleted}
        />
      )}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  )
}

export default ChatArea