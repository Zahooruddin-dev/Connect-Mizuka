import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import CallConfirmModal from './CallConfirmModal';
import { formatTime } from '../utils/time';
import Toast from './Toast';
import AudioPlayer from './AudioPlayer';
import DeleteConfirmModal from './DeleteConfirmModal';
import {
	PhoneIcon,
	VideoCallIcon,
	TrashIcon,
	DotsIcon,
	EditIcon,
	DownloadIcon,
	CopyIcon,
} from './message-item/MessageIcons';
import {
	FileMessage,
	VideoMessage,
	ImageMessage,
} from './message-item/MessageMedia';

const CALL_TYPES = new Set([
	'call_missed',
	'call_accepted',
	'call_rejected',
	'call_ended',
]);
const CALL_CONFIG = {
	call_missed: {
		theme: 'text-red-400 bg-red-400/10 border-red-400/20',
		label: 'Missed call',
		crossed: true,
	},
	call_accepted: {
		theme: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
		label: 'Call accepted',
		crossed: false,
	},
	call_rejected: {
		theme: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
		label: 'Call declined',
		crossed: true,
	},
	call_ended: {
		theme: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
		label: 'Call ended',
		crossed: true,
	},
};
const DELETE_LABELS = {
	audio: '[Voice message]',
	image: '[Image]',
	video: '[Video]',
	file: '[File]',
	document: '[File]',
};

function CallBadge({ type, content, timestamp }) {
	const cfg = CALL_CONFIG[type] || CALL_CONFIG.call_ended;
	const isVideo = type?.includes('video');
	const Icon = isVideo ? VideoCallIcon : PhoneIcon;

	return (
		<div className='flex flex-col items-center gap-1.5 py-2'>
			<div
				className={`flex items-center gap-2 px-4 py-1.5 border rounded-full text-xs font-medium tracking-wide select-none ${cfg.theme}`}
			>
				<span className='shrink-0 flex items-center justify-center'>
					<Icon crossed={cfg.crossed} />
				</span>
				<span>{cfg.label}</span>
				{content && content !== cfg.label && (
					<span className='opacity-60 font-normal truncate max-w-[120px]'>
						· {content}
					</span>
				)}
			</div>
			<span className='text-[10px] text-[var(--text-ghost)] font-mono select-none'>
				{formatTime(timestamp || Date.now())}
			</span>
		</div>
	);
}

function MessageItem({
	message,
	currentUserId,
	currentUserPicture,
	onDeleted,
	onEdit,
	onUserClick,
	onReply,
	onStartP2P,
	onStartCall,
}) {
	const [deleting, setDeleting] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content || '');
	const [menuOpen, setMenuOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [callData, setCallData] = useState(null);
	const menuRef = useRef(null);

	const senderId = message.sender_id || message.userId || message.user_id;
	const msgId = message.id || message._id;
	const isMine = senderId === currentUserId;
	const isCallMessage = CALL_TYPES.has(message.type);
	const isTextMessage = !message.type || message.type === 'text';
	const isMediaBubble = message.type === 'image' || message.type === 'video';
	const canCopy = isTextMessage && !message.is_deleted;
	const canEdit = isMine && isTextMessage && !message.is_deleted;
	const [messageCopy, setMessageCopy] = useState(false);
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
		} catch {
			const el = document.createElement('textarea');
			el.value = message.content || '';
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
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

	if (isCallMessage) {
		return (
			<>
				<CallBadge
					type={message.type}
					content={message.content}
					timestamp={
						message.created_at || message.createdAt || message.timestamp
					}
				/>
				{message.type === 'call_missed' && (
					<div className='flex justify-center mt-2'>
						<button
							className='px-3 py-1.5 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors duration-150'
							onClick={() =>
								setCallData({
									targetUserId: senderId,
									targetUsername: message.username,
									callType: 'audio',
								})
							}
						>
							Call back
						</button>
					</div>
				)}
				{showDeleteModal && (
					<DeleteConfirmModal
						message={{
							content: `[${CALL_CONFIG[message.type]?.label || 'Call'}]`,
						}}
						onConfirm={handleConfirmDelete}
						onCancel={() => setShowDeleteModal(false)}
					/>
				)}
			</>
		);
	}

	const renderBubbleContent = () => {
		if (isEditing) {
			return (
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
			);
		}

		if (message.is_deleted) {
			return (
				<p
					className={`text-sm leading-relaxed italic ${isMine ? 'text-white/50' : 'text-[var(--text-ghost)]'}`}
				>
					This message was deleted
				</p>
			);
		}

		if (message.type === 'audio') {
			return <AudioPlayer src={message.content} isMine={isMine} />;
		}

		if (message.type === 'image') {
			return <ImageMessage src={message.content} isMine={isMine} />;
		}

		if (message.type === 'video') {
			return <VideoMessage src={message.content} />;
		}

		if (message.type === 'file' || message.type === 'document') {
			return (
				<FileMessage
					src={message.content}
					name={message.filename || message.name}
					isMine={isMine}
				/>
			);
		}

		return (
			<div>
				{/** Render reply preview if available */}
				{(message.reply_to_message || replyPreview) &&
					(() => {
						const replied = message.reply_to_message || replyPreview;
						const isAudio = replied?.type === 'audio';
						const isP2P = !!message.chatroom_id;
						const quotedTextClass = isMine
							? 'text-white/95'
							: 'text-[var(--text-primary)]';
						return (
							<div
								className={`mb-2 p-2 rounded-md border text-[12px] ${isMine ? 'bg-[var(--accent-dim)] border-[var(--accent-dim)] text-white/80' : 'bg-[var(--bg-panel)] border-[var(--border)] text-[var(--text-secondary)]'}`}
							>
								{!isP2P && (
									<div className='text-[11px] text-[var(--text-secondary)] font-medium truncate'>
										{replied?.username || 'Unknown'}
									</div>
								)}
								<div className='mt-1'>
									{isAudio ? (
										<AudioPlayer
											src={replied.content}
											isMine={isMine}
											compact
										/>
									) : (
										<div
											className={`text-[13px] italic truncate ${quotedTextClass}`}
										>
											{replied?.type && replied.type !== 'text'
												? '[' + (replied.type || 'media') + ']'
												: replied?.content}
										</div>
									)}
								</div>
							</div>
						);
					})()}
				<p
					className={`text-sm leading-relaxed break-words ${isMine ? 'text-white/95' : 'text-[var(--text-primary)]'}`}
				>
					{message.content}
					{message.is_edited && (
						<span
							className={`text-[10px] italic ml-1.5 select-none ${isMine ? 'text-white/50' : 'text-[var(--text-ghost)]'}`}
						>
							(edited)
						</span>
					)}
				</p>
			</div>
		);
	};

	// replyPreview holds fetched preview when message.reply_to exists but no reply_to_message provided
	const [replyPreview, setReplyPreview] = useState(null);

	useEffect(() => {
		let mounted = true;
		const replyId =
			message.reply_to ||
			message.reply_to ||
			(message.reply_to_message && message.reply_to_message.id);
		if (!replyId || message.reply_to_message) return;
		(async () => {
			try {
				const isP2P = !!message.chatroom_id;
				const url = isP2P
					? `/p2p/message/${replyId}`
					: `/messages/message/${replyId}`;
				const res = await api.get(url);
				if (!mounted) return;
				if (res?.data?.message) setReplyPreview(res.data.message);
			} catch (err) {
				// ignore
			}
		})();
		return () => {
			mounted = false;
		};
	}, [message.reply_to, message.reply_to_message, message.chatroom_id]);

	const deleteModalContent = DELETE_LABELS[message.type] || message.content;

	// swipe-to-reply (mobile)
	const [dragOffset, setDragOffset] = useState(0);
	const startXRef = useRef(0);
	const draggingRef = useRef(false);
	const movedRef = useRef(false);
	const longPressTimerRef = useRef(null);
	const THRESHOLD = 80;

	const handleTouchStart = (e) => {
		startXRef.current = e.touches[0].clientX;
		draggingRef.current = true;
		movedRef.current = false;
		clearTimeout(longPressTimerRef.current);
		longPressTimerRef.current = setTimeout(() => {
			if (!movedRef.current) setMenuOpen(true);
		}, 520);
	};

	const handleTouchMove = (e) => {
		if (!draggingRef.current) return;
		movedRef.current = true;
		clearTimeout(longPressTimerRef.current);
		const cx = e.touches[0].clientX;
		const delta = cx - startXRef.current;
		if (delta > 0) {
			setDragOffset(Math.min(delta, 140));
		}
	};

	const handleTouchEnd = () => {
		draggingRef.current = false;
		clearTimeout(longPressTimerRef.current);
		if (dragOffset > THRESHOLD) {
			if (typeof onReply === 'function') onReply(message);
		}
		setDragOffset(0);
	};

	// mouse support (optional)
	const mouseDownRef = useRef(false);
	const handleMouseDown = (e) => {
		mouseDownRef.current = true;
		startXRef.current = e.clientX;
	};
	const handleMouseMove = (e) => {
		if (!mouseDownRef.current) return;
		const delta = e.clientX - startXRef.current;
		if (delta > 0) setDragOffset(Math.min(delta, 140));
	};
	const handleMouseUp = () => {
		if (!mouseDownRef.current) return;
		mouseDownRef.current = false;
		if (dragOffset > THRESHOLD) {
			if (typeof onReply === 'function') onReply(message);
		}
		setDragOffset(0);
	};

	useEffect(() => {
		return () => {
			clearTimeout(longPressTimerRef.current);
		};
	}, []);

	return (
		<>
			<style>{`
				@keyframes msg-in {
					from { opacity: 0; transform: translateY(6px); }
					to   { opacity: 1; transform: translateY(0); }
				}
			`}</style>

			<div
				className={`group flex items-end gap-2.5 py-[3px] animate-[msg-in_0.2s_ease-out] ${isMine ? 'flex-row-reverse' : ''}`}
			>
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
					className={`flex flex-col gap-[3px] max-w-[85%] sm:max-w-[65%] ${isMine ? 'items-end' : ''}`}
				>
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
						<div
							className={`relative ${isMediaBubble && !message.is_deleted ? 'p-0' : 'px-3.5 py-2.5'} overflow-hidden ${
								isMine
									? 'bg-teal-700 rounded-2xl rounded-br-md'
									: 'bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl rounded-bl-md'
							}`}
							style={{
								transform: `translateX(${dragOffset}px)`,
								transition:
									draggingRef.current || mouseDownRef.current
										? 'none'
										: 'transform 0.18s ease',
							}}
							onTouchStart={handleTouchStart}
							onTouchMove={handleTouchMove}
							onTouchEnd={handleTouchEnd}
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
						>
							{/* Reply indicator */}
							<div
								aria-hidden='true'
								className='absolute left-[-44px] top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-muted)] pointer-events-none'
								style={{ opacity: Math.min(dragOffset / THRESHOLD, 1) }}
							>
								<span className='text-[16px]'>↩</span>
							</div>
							{renderBubbleContent()}
						</div>

						{!isEditing && (
							<>
								<div className='hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
									{canCopy && (
										<button
											className={actionIconBase}
											onClick={handleCopy}
											title={copied ? 'Copied!' : 'Copy'}
											aria-label={copied ? 'Copied' : 'Copy message'}
										>
											<CopyIcon done={copied} />
										</button>
									)}
									{canEdit && (
										<button
											className={actionIconBase}
											onClick={handleStartEdit}
											title='Edit'
											aria-label='Edit message'
										>
											<EditIcon />
										</button>
									)}
									{isMine && (
										<button
											className={`${actionIconBase} hover:!text-red-400 hover:!bg-red-400/10`}
											onClick={handleDeleteClick}
											title='Delete'
											aria-label='Delete message'
										>
											<TrashIcon />
										</button>
									)}
								</div>

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
										<DotsIcon />
									</button>

									{menuOpen && (
										<div
											className={`absolute bottom-[calc(100%+6px)] z-[200] bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg shadow-md min-w-[130px] overflow-hidden animate-[context-pop_0.12s_cubic-bezier(0.16,1,0.3,1)] ${isMine ? 'right-0' : 'left-0'}`}
										>
											{canCopy && (
												<button
													className={contextItemBase}
													onClick={handleCopy}
												>
													<CopyIcon done={copied} />
													{copied ? 'Copied!' : 'Copy'}
												</button>
											)}
											{canEdit && (
												<button
													className={contextItemBase}
													onClick={handleStartEdit}
												>
													<EditIcon />
													Edit
												</button>
											)}
											{isMine && (
												<button
													className={`${contextItemBase} !text-red-500 hover:!bg-red-500/10`}
													onClick={handleDeleteClick}
													disabled={deleting}
												>
													<TrashIcon />
													{deleting ? 'Deleting…' : 'Delete'}
												</button>
											)}
										</div>
									)}
								</div>
							</>
						)}
					</div>

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

			{copied && (
				<Toast message='Copied to clipboard' visible={copied} type='success' />
			)}
			{showDeleteModal && (
				<DeleteConfirmModal
					message={{ content: deleteModalContent }}
					onConfirm={handleConfirmDelete}
					onCancel={() => setShowDeleteModal(false)}
				/>
			)}
		</>
	);
}

export default MessageItem;
