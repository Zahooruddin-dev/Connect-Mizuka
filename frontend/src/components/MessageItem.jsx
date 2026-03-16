import { useState } from 'react';
import { formatTime } from '../utils/time';
import { deleteMessage } from '../services/api';
import './styles/MessageItem.css';

function MessageItem({
	message,
	currentUserId,
	currentUserPicture,
	onDeleted,
	onEdit,
	onUserClick,
}) {
	const [deleting, setDeleting] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content || '');

	const senderId = message.sender_id || message.userId || message.user_id;
	const msgId = message.id || message._id;
	const isMine = senderId === currentUserId;

	const handleDelete = async () => {
		if (deleting) return;
		setDeleting(true);
		try {
			await deleteMessage(msgId, currentUserId);
			onDeleted(msgId);
		} catch {
			setDeleting(false);
		}
	};

	const handleSaveEdit = async () => {
		if (!editContent.trim() || editContent === message.content) {
			setIsEditing(false);
			return;
		}
		try {
			await onEdit(msgId, editContent);
			setIsEditing(false);
		} catch (error) {
			console.error('Failed to edit message', error);
		}
	};

	const handleUserClick = () => {
		if (typeof onUserClick === 'function') onUserClick(senderId);
	};
console.log(currentUserPicture);

	const theirPicture = message.profile_picture || null;
	const minePicture = currentUserPicture || null;
	const theirInitial = message.username?.[0]?.toUpperCase() || '?';
	const mineInitial = message.username?.[0]?.toUpperCase() || '?';

	return (
		<div className={`message-item ${isMine ? 'mine' : 'theirs'}`}>
			{!isMine && (
				<button
					className='message-avatar-btn'
					onClick={handleUserClick}
					title={`View ${message.username}'s profile`}
				>
					{theirPicture ? (
						<img
							src={theirPicture}
							alt={message.username}
							className='message-avatar message-avatar--img'
						/>
					) : (
						<div className='message-avatar'>{theirInitial}</div>
					)}
				</button>
			)}

			<div className='message-content'>
				{!isMine && (
					<button
						className='message-author-btn'
						onClick={handleUserClick}
						title={`View ${message.username}'s profile`}
					>
						{message.username}
					</button>
				)}

				<div className='message-bubble-wrap'>
					<div className='message-bubble'>
						{isEditing ? (
							<div className='edit-input-container'>
								<input
									type='text'
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
									autoFocus
									className='edit-input'
								/>
								<div className='edit-actions'>
									<button onClick={handleSaveEdit} className='edit-save-btn'>
										Save
									</button>
									<button
										onClick={() => setIsEditing(false)}
										className='edit-cancel-btn'
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<p className='message-text'>
								{message.content}
								{message.is_edited && (
									<span className='edited-flag'> (edited)</span>
								)}
							</p>
						)}
					</div>

					{isMine && !isEditing && (
						<div className='message-action-buttons'>
							<button
								className='message-action-icon'
								onClick={() => {
									setEditContent(message.content);
									setIsEditing(true);
								}}
								title='Edit message'
							>
								<svg
									width='13'
									height='13'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<path d='M12 20h9'></path>
									<path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'></path>
								</svg>
							</button>
							<button
								className={`message-action-icon message-delete ${deleting ? 'deleting' : ''}`}
								onClick={handleDelete}
								title='Delete message'
							>
								<svg
									width='13'
									height='13'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<polyline points='3,6 5,6 21,6' />
									<path d='M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6' />
									<path d='M10,11v6M14,11v6' />
									<path d='M9,6V4h6v2' />
								</svg>
							</button>
						</div>
					)}
				</div>

				<span className='message-time'>
					{formatTime(
						message.created_at ||
							message.createdAt ||
							message.timestamp ||
							Date.now(),
					)}
				</span>
			</div>

			{isMine && (
				<button
					className='message-avatar-btn'
					onClick={handleUserClick}
					title={`View ${message.username}'s profile`}
				>
					{minePicture ? (
						<img
							src={minePicture}
							alt={message.username}
							className='message-avatar mine-avatar message-avatar--img'
						/>
					) : (
						<div className='message-avatar mine-avatar'>{mineInitial}</div>
					)}
				</button>
			)}
		</div>
	);
}

export default MessageItem;
