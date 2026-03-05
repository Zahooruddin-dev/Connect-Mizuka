import { useEffect, useRef, useState } from 'react'
import MessageItem from './MessageItem'
import UserProfilePopover from './Userprofilepopover'
import './styles/MessageList.css'

function MessageList({ messages, typingUsers, currentUserId, onMessageDeleted }) {
	const bottomRef = useRef(null)
	const [selectedUser, setSelectedUser] = useState(null)
	const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, typingUsers])

	const handleUserClick = (userId, event) => {
		const rect = event.currentTarget.getBoundingClientRect()
		const top = rect.bottom + 8
		const left = Math.max(16, rect.left - 100)

		setSelectedUser(userId)
		setPopoverPosition({ top, left })
	}

	const handleClosePopover = () => {
		setSelectedUser(null)
	}

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
						onUserClick={handleUserClick}
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

			{selectedUser && (
				<UserProfilePopover
					userId={selectedUser}
					position={popoverPosition}
					onClose={handleClosePopover}
				/>
			)}
		</div>
	)
}

export default MessageList