import { useState, useRef, useEffect, useCallback } from 'react';
import {
	Pencil,
	Check,
	X,
	Trash2,
	Hash,
	ArrowLeft,
	Phone,
	Video,
} from 'lucide-react';
import { deleteChannel, updateChannel, getUserProfile } from '../services/api';
import UserProfilePopover from './Userprofilepopover';
import socket from '../services/socket';

const iconBtnCls =
	'flex items-center justify-center w-8 h-8 rounded-lg transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

function ChatHeader({
	channelId,
	channelLabel,
	instituteId,
	onChannelDeleted,
	onChannelRenamed,
	isAdmin,
	isP2P,
	otherUsername,
	otherUserId,
	onCloseP2P,
	onStartCall,
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState('');
	const [editing, setEditing] = useState(false);
	const [nameInput, setNameInput] = useState(channelLabel || '');
	const [saving, setSaving] = useState(false);
	const [displayName, setDisplayName] = useState(channelLabel || '');
	const [otherPicture, setOtherPicture] = useState(null);
	const [showPopover, setShowPopover] = useState(false);

	const inputRef = useRef(null);
	const channelIdRef = useRef(channelId);

	useEffect(() => {
		channelIdRef.current = channelId;
	}, [channelId]);
	useEffect(() => {
		setNameInput(channelLabel || '');
		setDisplayName(channelLabel || '');
	}, [channelLabel]);
	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [editing]);
	useEffect(() => {
		if (!isP2P || !otherUserId) return;
		setOtherPicture(null);
		getUserProfile(otherUserId)
			.then((data) => {
				if (data?.user?.profile_picture)
					setOtherPicture(data.user.profile_picture);
			})
			.catch(() => {});
	}, [isP2P, otherUserId]);

	useEffect(() => {
		if (isP2P) return;
		const handleSocketRenamed = ({ channel }) => {
			if (channel.id === channelIdRef.current) {
				setDisplayName(channel.name);
				setNameInput(channel.name);
			}
		};
		const handleSocketDeleted = ({ channelId: deletedId }) => {
			if (deletedId === channelIdRef.current) onChannelDeleted?.(deletedId);
		};
		socket.on('channel_renamed', handleSocketRenamed);
		socket.on('channel_deleted', handleSocketDeleted);
		return () => {
			socket.off('channel_renamed', handleSocketRenamed);
			socket.off('channel_deleted', handleSocketDeleted);
		};
	}, [isP2P, onChannelDeleted]);

	const handleEditStart = useCallback(() => {
		setNameInput(channelLabel || '');
		setError('');
		setEditing(true);
	}, [channelLabel]);
	const handleEditCancel = useCallback(() => {
		setEditing(false);
		setNameInput(channelLabel || '');
		setError('');
	}, [channelLabel]);

	const handleEditSave = useCallback(async () => {
		const trimmed = nameInput
			.trim()
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-_]/g, '');
		if (!trimmed) {
			setError('Channel name cannot be empty');
			return;
		}
		if (trimmed === channelLabel) {
			setEditing(false);
			return;
		}
		setSaving(true);
		setError('');
		const res = await updateChannel(channelId, { name: trimmed });
		setSaving(false);
		if (res?.channel) {
			setDisplayName(res.channel.name);
			socket.emit('channel_renamed', { channel: res.channel, instituteId });
			setEditing(false);
			onChannelRenamed?.(res.channel);
		} else {
			setError(res?.message || 'Failed to rename channel');
		}
	}, [nameInput, channelLabel, channelId, instituteId, onChannelRenamed]);

	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === 'Enter') handleEditSave();
			if (e.key === 'Escape') handleEditCancel();
		},
		[handleEditSave, handleEditCancel],
	);

	const handleDeleteChannel = useCallback(async () => {
		setDeleting(true);
		setError('');
		try {
			const res = await deleteChannel(channelId);
			if (res?.error) {
				setError(res.error);
				setDeleting(false);
				setShowConfirm(false);
				return;
			}
			socket.emit('channel_deleted', { channelId, instituteId });
			onChannelDeleted?.(channelId);
		} catch {
			setError('Failed to delete channel');
		} finally {
			setDeleting(false);
			setShowConfirm(false);
		}
	}, [channelId, instituteId, onChannelDeleted]);

	if (isP2P) {
		return (
			<>
				<header className='flex items-center gap-2 px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0'>
					{onCloseP2P && (
						<button
							className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]`}
							onClick={onCloseP2P}
							aria-label='Back to channels'
						>
							<ArrowLeft size={16} strokeWidth={2} />
						</button>
					)}

					<button
						className='flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg px-1 py-1 transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
						onClick={() => setShowPopover(true)}
						title={`View ${otherUsername}'s profile`}
					>
						{otherPicture ? (
							<img
								src={otherPicture}
								alt={otherUsername}
								className='w-8 h-8 rounded-full object-cover shrink-0'
							/>
						) : (
							<div
								className='w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-white/90 shrink-0'
								style={{
									background:
										'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
								}}
								aria-hidden='true'
							>
								{otherUsername?.[0]?.toUpperCase() || 'U'}
							</div>
						)}
						<div className='min-w-0'>
							<div className='text-sm font-medium text-[var(--text-primary)] truncate leading-tight'>
								{otherUsername
									? otherUsername[0].toUpperCase() + otherUsername.slice(1)
									: 'Chat'}
							</div>
							<div className='text-[11px] text-[var(--text-ghost)]'>
								Direct Message
							</div>
						</div>
					</button>

					{onStartCall && otherUserId && (
						<div className='flex items-center gap-1 shrink-0'>
							<button
								className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--teal-500)]`}
								onClick={() =>
									onStartCall({
										targetUserId: otherUserId,
										targetUsername: otherUsername,
										callType: 'audio',
									})
								}
								aria-label='Start audio call'
								title='Audio call'
							>
								<Phone size={16} strokeWidth={2} />
							</button>
							<button
								className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--teal-500)]`}
								onClick={() =>
									onStartCall({
										targetUserId: otherUserId,
										targetUsername: otherUsername,
										callType: 'video',
									})
								}
								aria-label='Start video call'
								title='Video call'
							>
								<Video size={16} strokeWidth={2} />
							</button>
						</div>
					)}
				</header>

				{showPopover && otherUserId && (
					<UserProfilePopover
						userId={otherUserId}
						onClose={() => setShowPopover(false)}
						onStartP2P={null}
					/>
				)}
			</>
		);
	}

	return (
		<header className='hidden md:flex items-center gap-3 px-5 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0'>
			<div className='flex items-center gap-2 flex-1 min-w-0'>
				{editing ? (
					<div className='flex items-center gap-1.5 flex-1 min-w-0'>
						<Hash
							size={15}
							strokeWidth={2}
							className='text-[var(--text-ghost)] shrink-0'
							aria-hidden='true'
						/>
						<input
							ref={inputRef}
							className='flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--teal-600)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none shadow-[0_0_0_2px_rgba(20,184,166,0.07)] font-[inherit] transition-[border-color] duration-150 disabled:opacity-50'
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
							onKeyDown={handleKeyDown}
							maxLength={64}
							disabled={saving}
							aria-label='Channel name'
							spellCheck={false}
						/>
						<button
							className={`${iconBtnCls} text-[var(--teal-600)] hover:bg-teal-500/[0.08] disabled:opacity-40`}
							onClick={handleEditSave}
							disabled={saving}
							aria-label='Save name'
						>
							<Check size={14} strokeWidth={2.5} />
						</button>
						<button
							className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-red-400 disabled:opacity-40`}
							onClick={handleEditCancel}
							disabled={saving}
							aria-label='Cancel editing'
						>
							<X size={14} strokeWidth={2.5} />
						</button>
					</div>
				) : (
					<div className='flex items-center gap-2 group flex-1 min-w-0'>
						<Hash
							size={15}
							strokeWidth={2}
							className='text-[var(--text-ghost)] shrink-0'
							aria-hidden='true'
						/>
						<span className='text-sm font-medium text-[var(--text-primary)] tracking-[-0.1px] truncate'>
							{displayName || channelId}
						</span>
						{isAdmin && (
							<button
								className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-[opacity,background,color] duration-150`}
								onClick={handleEditStart}
								aria-label='Rename channel'
							>
								<Pencil size={13} strokeWidth={2} />
							</button>
						)}
					</div>
				)}
			</div>
			<div className='flex items-center gap-2 shrink-0'>
				{error && <span className='text-[12px] text-red-400'>{error}</span>}
				{isAdmin &&
					!editing &&
					(showConfirm ? (
						<div className='flex items-center gap-2'>
							<span className='text-[12px] text-[var(--text-muted)]'>
								Delete channel?
							</span>
							<button
								className='px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-[12px] font-medium hover:bg-red-500/20 transition-[background] duration-150 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-red-400'
								onClick={handleDeleteChannel}
								disabled={deleting}
							>
								{deleting ? 'Deleting…' : 'Yes'}
							</button>
							<button
								className='px-2.5 py-1 rounded-md bg-[var(--bg-hover)] text-[var(--text-muted)] text-[12px] font-medium hover:bg-[var(--border)] transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
								onClick={() => setShowConfirm(false)}
							>
								No
							</button>
						</div>
					) : (
						<button
							className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--text-ghost)] hover:text-red-400 hover:bg-red-400/[0.06] transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={() => setShowConfirm(true)}
							title='Delete channel'
						>
							<Trash2 size={13} strokeWidth={2} aria-hidden='true' />
							Delete
						</button>
					))}
			</div>
		</header>
	);
}

export default ChatHeader;
