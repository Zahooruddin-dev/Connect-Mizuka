import { useState } from 'react';
import { formatTime } from '../utils/time';
import { deleteMessage } from '../services/api';
import './styles/MessageItem.css';

function MessageItem({ message, currentUserId, onDeleted, onUserClick }) {
	const [deleting, setDeleting] = useState(false);

	const senderId = message.sender_id || message.userId || message.user_id;
	const isMine = senderId === currentUserId;

	const handleDelete = async () => {
		if (deleting) return;
		setDeleting(true);
		try {
			const msgId = message.id || message._id;
			await deleteMessage(msgId, currentUserId);
			onDeleted(msgId);
		} catch {
			setDeleting(false);
		}
	};

	const handleUserClick = (e) => {
		if (typeof onUserClick === 'function') {
			onUserClick(senderId, e);
		}
	};

	return (
		<div className={`message-item ${isMine ? 'mine' : 'theirs'}`}>
			{!isMine && (
				<button
					className="message-avatar-btn"
					onClick={handleUserClick}
					title={`View ${message.username}'s profile`}
				>
					<div className="message-avatar">
						{message.username?.[0]?.toUpperCase() || '?'}
					</div>
				</button>
			)}
			<div className="message-content">
				{!isMine && (
					<button
						className="message-author-btn"
						onClick={handleUserClick}
						title={`View ${message.username}'s profile`}
					>
						{message.username}
					</button>
				)}
				<div className="message-bubble-wrap">
					<div className="message-bubble">
						<p className="message-text">{message.content}</p>
					</div>
					{isMine && (
						<button
							className={`message-delete ${deleting ? 'deleting' : ''}`}
							onClick={handleDelete}
							title="Delete message"
						>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="3,6 5,6 21,6" />
								<path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
								<path d="M10,11v6M14,11v6" />
								<path d="M9,6V4h6v2" />
							</svg>
						</button>
					)}
				</div>
				<span className="message-time">{formatTime(message.created_at || message.createdAt || message.timestamp || Date.now())}</span>
			</div>
			{isMine && (
				<button
					className="message-avatar-btn"
					onClick={handleUserClick}
					title={`View ${message.username}'s profile`}
				>
					<div className="message-avatar mine-avatar">
						{message.username?.[0]?.toUpperCase() || '?'}
					</div>
				</button>
			)}
		</div>
	);
}

export default MessageItem;