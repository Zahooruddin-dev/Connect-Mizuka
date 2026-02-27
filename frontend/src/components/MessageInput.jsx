import { useState, useRef, useCallback } from 'react'
import './MessageInput.css'

function MessageInput({ onSend, onTyping, onStopTyping }) {
  const [text, setText] = useState('')
  const typingRef = useRef(false)
  const typingTimer = useRef(null)

  const triggerStopTyping = useCallback(() => {
    if (typingRef.current) {
      typingRef.current = false
      onStopTyping()
    }
  }, [onStopTyping])

  const handleChange = (e) => {
    setText(e.target.value)
    if (!typingRef.current) {
      typingRef.current = true
      onTyping()
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(triggerStopTyping, 2000)
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    clearTimeout(typingTimer.current)
    triggerStopTyping()
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="message-input-bar">
      <div className="message-input-wrap">
        <textarea
          className="message-input"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
        />
        <button
          className={`message-send-btn ${text.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim()}
          title="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>
      <p className="message-input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}

export default MessageInput
