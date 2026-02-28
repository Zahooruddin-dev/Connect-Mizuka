import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import './styles/MessageList.css'

function MessageList({ messages, typingUsers, currentUserId, onMessageDeleted }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  return (
    <div className="message-list">
      <div className="message-list-inner">
        {messages.length === 0 && (
          <div className="message-empty">
            <span>No messages yet. Start the conversation.</span>
          </div>
        )}
        {messages.map(msg => (
          <MessageItem
            key={msg._id || msg.id || msg.tempId}
            message={msg}
            currentUserId={currentUserId}
            onDeleted={onMessageDeleted}
          />
        ))}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span className="typing-label">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default MessageList
