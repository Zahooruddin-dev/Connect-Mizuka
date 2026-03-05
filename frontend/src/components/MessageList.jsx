import { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import UserProfilePopover from './Userprofilepopover';
import './styles/MessageList.css';

function MessageList({ messages, typingUsers, currentUserId, onMessageDeleted, onStartP2P }) {
	const bottomRef = useRef(null);
	const [selectedUser, setSelectedUser] = useState(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, typingUsers]);

	const handleUserClick = (userId) => {
		setSelectedUser(userId);
	};

	const handleClosePopover = () => {
		setSelectedUser(null);
	};

	return (
		<div className="message-list">
			<div className="message-list-inner">
				{messages.length === 0 && (
					<div className="message-empty">
						<span>No messages yet. Start the conversation.</span>
					</div>
				)}
				{messages.map((msg) => (
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
							<span />
							<span />
							<span />
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
					onClose={handleClosePopover}
					onStartP2P={onStartP2P}
				/>
			)}
		</div>
	);
}

export default MessageList;