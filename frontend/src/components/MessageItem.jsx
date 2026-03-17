import { useState, useRef, useEffect } from 'react';
import { formatTime } from '../utils/time';
import { deleteMessage } from '../services/api';
import './styles/MessageItem.css';
import Toast from './Toast';

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
	const [menuOpen, setMenuOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const menuRef = useRef(null);

	const senderId = message.sender_id || message.userId || message.user_id;
	const msgId = message.id || message._id;
	const isMine = senderId === currentUserId;

	// Close menu when clicking outside
	useEffect(() => {
		if (!menuOpen) return;
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		document.addEventListener('touchstart', handler);
		return () => {
			document.removeEventListener('mousedown', handler);
			document.removeEventListener('touchstart', handler);
		};
	}, [menuOpen]);

	const handleDelete = async () => {
		setMenuOpen(false);
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

	const handleCopy = async () => {
		setMenuOpen(false);
		try {
			await navigator.clipboard.writeText(message.content || '');
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// fallback for older browsers
			const el = document.createElement('textarea');
			el.value = message.content || '';
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleStartEdit = () => {
		setMenuOpen(false);
		setEditContent(message.content);
		setIsEditing(true);
	};

	const handleUserClick = () => {
		if (typeof onUserClick === 'function') onUserClick(senderId);
	};

	const theirPicture = message.profile_picture || null;
	const minePicture = currentUserPicture || null;
	const theirInitial = message.username?.[0]?.toUpperCase() || '?';
	const mineInitial = message.username?.[0]?.toUpperCase() || '?';

	return (
		<>
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
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSaveEdit();
											if (e.key === 'Escape') setIsEditing(false);
										}}
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

						{/* ── Desktop actions (hover, always mine) ── */}
						{isMine && !isEditing && (
							<div className='message-action-buttons message-action-buttons--desktop'>
								<button
									className='message-action-icon'
									onClick={handleCopy}
									title={copied ? 'Copied!' : 'Copy'}
								>
									{copied ? (
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
											<polyline points='20,6 9,17 4,12' />
										</svg>
									) : (
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
											<rect
												x='9'
												y='9'
												width='13'
												height='13'
												rx='2'
												ry='2'
											></rect>
											<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>
										</svg>
									)}
								</button>
								<button
									className='message-action-icon'
									onClick={handleStartEdit}
									title='Edit'
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
									title='Delete'
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

						{/* ── Copy button for "theirs" on desktop ── */}
						{!isMine && !isEditing && (
							<div className='message-action-buttons message-action-buttons--desktop message-action-buttons--theirs'>
								<button
									className='message-action-icon'
									onClick={handleCopy}
									title={copied ? 'Copied!' : 'Copy'}
								>
									{copied ? (
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
											<polyline points='20,6 9,17 4,12' />
										</svg>
									) : (
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
											<rect
												x='9'
												y='9'
												width='13'
												height='13'
												rx='2'
												ry='2'
											></rect>
											<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>
										</svg>
									)}
								</button>
							</div>
						)}

						{/* ── Mobile three-dot menu ── */}
						{!isEditing && (
							<div className='message-mobile-menu' ref={menuRef}>
								<button
									className='message-dots-btn'
									onClick={() => setMenuOpen((v) => !v)}
									aria-label='Message options'
									aria-expanded={menuOpen}
								>
									<svg
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<circle cx='5' cy='12' r='2' />
										<circle cx='12' cy='12' r='2' />
										<circle cx='19' cy='12' r='2' />
									</svg>
								</button>

								{menuOpen && (
									<div
										className={`message-context-menu ${isMine ? 'message-context-menu--mine' : 'message-context-menu--theirs'}`}
									>
										<button
											className='message-context-item'
											onClick={handleCopy}
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
												<rect
													x='9'
													y='9'
													width='13'
													height='13'
													rx='2'
													ry='2'
												></rect>
												<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>
											</svg>
											{copied ? 'Copied!' : 'Copy'}
										</button>
										{isMine && (
											<>
												<button
													className='message-context-item'
													onClick={handleStartEdit}
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
													Edit
												</button>
												<button
													className='message-context-item message-context-item--danger'
													onClick={handleDelete}
													disabled={deleting}
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
													{deleting ? 'Deleting…' : 'Delete'}
												</button>
											</>
										)}
									</div>
								)}
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

			<Toast message='Copied to clipboard' visible={copied} type='success' />
		</>
	);
}

export default MessageItem;
