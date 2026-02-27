import { useState, useEffect, useCallback } from 'react'
import socket from '../services/socket'
import { fetchMessages } from '../services/api'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import './ChatArea.css'

function ChatArea({ channelId, channelLabel, user }) {
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setMessages([])
    setTypingUsers([])

    socket.emit('join_institute', channelId)

    fetchMessages(channelId)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.messages || []
        setMessages(data)
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))

    const handleReceive = (msg) => {
      const normalised = {
        id: msg.id,
        content: msg.text ?? msg.content,
        sender_id: msg.from ?? msg.sender_id,
        username: msg.username,
        created_at: msg.timestamp ?? msg.created_at
      }
      setMessages(prev => [...prev, normalised])
    }

    const handleDisplayTyping = ({ username }) => {
      setTypingUsers(prev =>
        prev.includes(username) ? prev : [...prev, username]
      )
    }

    const handleHideTyping = () => {
      setTypingUsers([])
    }

    socket.on('receive_message', handleReceive)
    socket.on('Display_typing', handleDisplayTyping)
    socket.on('hide_typing', handleHideTyping)

    return () => {
      socket.off('receive_message', handleReceive)
      socket.off('Display_typing', handleDisplayTyping)
      socket.off('hide_typing', handleHideTyping)
    }
  }, [channelId])

  const handleSend = useCallback((content) => {
    socket.emit('send_message', {
      channel_id: channelId,
      message: content,
      sender_id: user.id,
      username: user.username
    })
  }, [channelId, user])

  const handleTyping = useCallback(() => {
    socket.emit('typing', {
      channel_id: channelId,
      username: user.username
    })
  }, [channelId, user])

  const handleStopTyping = useCallback(() => {
    socket.emit('stop_typing', {
      channel_id: channelId,
      username: user.username
    })
  }, [channelId, user])

  const handleMessageDeleted = useCallback((id) => {
    setMessages(prev => prev.filter(m => (m.id || m._id) !== id))
  }, [])

  const handleChannelDeleted = useCallback(() => {
    setMessages([])
  }, [])

  return (
    <div className="chat-area">
      <ChatHeader
        channelId={channelId}
        channelLabel={channelLabel}
        onChannelDeleted={handleChannelDeleted}
      />
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
          currentUserId={user.id}
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