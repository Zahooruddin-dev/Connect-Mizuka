import { useState, useRef, useEffect } from 'react';
import { formatTime } from '../utils/time';
import Toast from './Toast';
import AudioPlayer from './AudioPlayer';
import DeleteConfirmModal from './DeleteConfirmModal';

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
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const menuRef = useRef(null);

	const senderId = message.sender_id || message.userId || message.user_id;
	const msgId = message.id || message._id;
	const isMine = senderId === currentUserId;

	useEffect(() => {
		if (!menuOpen) return;
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target))
				setMenuOpen(false);
		};
		document.addEventListener('mousedown', handler);
		document.addEventListener('touchstart', handler);
		return () => {
			document.removeEventListener('mousedown', handler);
			document.removeEventListener('touchstart', handler);
		};
	}, [menuOpen]);

	const handleDeleteClick = () => {
		setMenuOpen(false);
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async () => {
		setShowDeleteModal(false);
		if (deleting) return;
		setDeleting(true);
		try {
			await onDeleted(msgId);
		} catch {
			setDeleting(false);
		}
	};

	const handleCancelDelete = () => {
		setShowDeleteModal(false);
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

	const avatarBase =
		'w-7 h-7 min-w-[28px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white/90 mb-[18px] shrink-0';
	const actionIconBase =
		'p-[5px] rounded-md flex items-center cursor-pointer transition-colors duration-150 text-[var(--text-ghost)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';
	const contextItemBase =
		'w-full flex items-center gap-2 px-3.5 py-2.5 text-[13px] text-[var(--text-secondary)] cursor-pointer transition-colors duration-150 text-left hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] disabled:opacity-50 disabled:pointer-events-none';

	const CopyIcon = () =>
		copied ? (
			<svg
				width='13'
				height='13'
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='2'
				strokeLinecap='round'
				strokeLinejoin='round'
				aria-hidden='true'
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
				aria-hidden='true'
			>
				<rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
				<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
			</svg>
		);

	return (
		<>
			<style>{`
        @keyframes msg-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

			<div
				className={`group flex items-end gap-2.5 py-[3px] animate-[msg-in_0.2s_ease-out] ${
					isMine ? 'flex-row-reverse' : ''
				}`}
			>
				{/* Avatar */}
				<button
					className='p-0 flex items-center rounded-full transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
					onClick={handleUserClick}
					title={`View ${message.username}'s profile`}
				>
					{isMine ? (
						minePicture ? (
							<img
								src={minePicture}
								alt={message.username}
								className='w-7 h-7 min-w-[28px] rounded-full object-cover mb-[18px]'
							/>
						) : (
							<div
								className={avatarBase}
								style={{
									background:
										'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
								}}
							>
								{mineInitial}
							</div>
						)
					) : theirPicture ? (
						<img
							src={theirPicture}
							alt={message.username}
							className='w-7 h-7 min-w-[28px] rounded-full object-cover mb-[18px]'
						/>
					) : (
						<div
							className={avatarBase}
							style={{
								background:
									'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
							}}
						>
							{theirInitial}
						</div>
					)}
				</button>

				<div
					className={`flex flex-col gap-[3px] max-w-[65%] ${isMine ? 'items-end' : ''}`}
				>
					{/* Username (others) */}
					{!isMine && (
						<button
							className='px-1 py-0 m-0 text-[11px] font-medium text-[var(--text-secondary)] tracking-[0.01em] cursor-pointer transition-colors duration-150 text-left hover:text-[var(--text-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={handleUserClick}
							title={`View ${message.username}'s profile`}
						>
							{message.username}
						</button>
					)}

					<div
						className={`flex items-center gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}
					>
						{/* Message bubble */}
						<div
							className={`px-3.5 py-2.5 relative ${
								isMine
									? 'bg-teal-700 rounded-2xl rounded-br-md'
									: 'bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl rounded-bl-md'
							}`}
						>
							{isEditing ? (
								<div className='flex flex-col gap-2 min-w-[180px]'>
									<input
										type='text'
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSaveEdit();
											if (e.key === 'Escape') setIsEditing(false);
										}}
										autoFocus
										className='bg-black/20 border border-white/10 text-[var(--text-primary)] text-sm leading-relaxed px-2.5 py-1.5 rounded-md outline-none font-[inherit] w-full transition-colors duration-150 focus:border-teal-500/40 focus:bg-black/30'
									/>
									<div className='flex justify-end gap-1.5'>
										<button
											onClick={handleSaveEdit}
											className='text-teal-400 bg-teal-400/10 text-[11px] font-medium px-2.5 py-1 rounded transition-colors duration-150 hover:bg-teal-400/20'
										>
											Save
										</button>
										<button
											onClick={() => setIsEditing(false)}
											className='text-[var(--text-ghost)] text-[11px] font-medium px-2.5 py-1 rounded transition-colors duration-150 hover:bg-white/10 hover:text-[var(--text-muted)]'
										>
											Cancel
										</button>
									</div>
								</div>
							) : message.is_deleted ? (
								<p
									className={`text-sm leading-relaxed italic ${
										isMine ? 'text-white/50' : 'text-[var(--text-ghost)]'
									}`}
								>
									This message was deleted
								</p>
							) : message.type === 'audio' ? (
								<AudioPlayer src={message.content} isMine={isMine} />
							) : (
								<p
									className={`text-sm leading-relaxed break-words ${
										isMine ? 'text-white/95' : 'text-[var(--text-primary)]'
									}`}
								>
									{message.content}
									{message.is_edited && (
										<span
											className={`text-[10px] italic ml-1.5 select-none ${
												isMine ? 'text-white/50' : 'text-[var(--text-ghost)]'
											}`}
										>
											(edited)
										</span>
									)}
								</p>
							)}
						</div>

						{/* Desktop actions (own messages) */}
						{isMine && !isEditing && (
							<div className='hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
								<button
									className={actionIconBase}
									onClick={handleCopy}
									title={copied ? 'Copied!' : 'Copy'}
									aria-label={copied ? 'Copied' : 'Copy message'}
								>
									<CopyIcon />
								</button>
								<button
									className={actionIconBase}
									onClick={handleStartEdit}
									title='Edit'
									aria-label='Edit message'
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
										aria-hidden='true'
									>
										<path d='M12 20h9' />
										<path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' />
									</svg>
								</button>
								<button
									className={`${actionIconBase} hover:!text-red-400 hover:!bg-red-400/10`}
									onClick={handleDeleteClick}
									title='Delete'
									aria-label='Delete message'
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
										aria-hidden='true'
									>
										<polyline points='3,6 5,6 21,6' />
										<path d='M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6' />
										<path d='M10,11v6M14,11v6' />
										<path d='M9,6V4h6v2' />
									</svg>
								</button>
							</div>
						)}

						{/* Desktop actions (others) – only copy */}
						{!isMine && !isEditing && (
							<div className='hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
								<button
									className={actionIconBase}
									onClick={handleCopy}
									title={copied ? 'Copied!' : 'Copy'}
									aria-label={copied ? 'Copied' : 'Copy message'}
								>
									<CopyIcon />
								</button>
							</div>
						)}

						{/* Mobile menu */}
						{!isEditing && (
							<div
								className='relative flex md:hidden items-center'
								ref={menuRef}
							>
								<button
									className='w-7 h-7 rounded-md text-[var(--text-ghost)] flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
									onClick={() => setMenuOpen((v) => !v)}
									aria-label='Message options'
									aria-expanded={menuOpen}
								>
									<svg
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='currentColor'
										aria-hidden='true'
									>
										<circle cx='5' cy='12' r='2' />
										<circle cx='12' cy='12' r='2' />
										<circle cx='19' cy='12' r='2' />
									</svg>
								</button>

								{menuOpen && (
									<div
										className={`absolute bottom-[calc(100%+6px)] z-[200] bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg shadow-md min-w-[130px] overflow-hidden animate-[context-pop_0.12s_cubic-bezier(0.16,1,0.3,1)] ${
											isMine ? 'right-0' : 'left-0'
										}`}
									>
										<button className={contextItemBase} onClick={handleCopy}>
											<CopyIcon />
											{copied ? 'Copied!' : 'Copy'}
										</button>
										{isMine && (
											<>
												<button
													className={contextItemBase}
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
														aria-hidden='true'
													>
														<path d='M12 20h9' />
														<path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' />
													</svg>
													Edit
												</button>
												<button
													className={`${contextItemBase} !text-red-600 hover:!bg-red-600/10`}
													onClick={handleDeleteClick}
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
														aria-hidden='true'
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

					{/* Timestamp */}
					<span className='text-[10px] text-[var(--text-ghost)] font-mono px-1'>
						{formatTime(
							message.created_at ||
								message.createdAt ||
								message.timestamp ||
								Date.now(),
						)}
					</span>
				</div>
			</div>

			<Toast message='Copied to clipboard' visible={copied} type='success' />

			{/* Delete confirmation modal */}
			{showDeleteModal && (
				<DeleteConfirmModal
					message={{
						content:
							message.type === 'audio' ? '[Voice message]' : message.content,
					}}
					onConfirm={handleConfirmDelete}
					onCancel={handleCancelDelete}
				/>
			)}
		</>
	);
}

export default MessageItem;
