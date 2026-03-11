import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Check, X, Trash2, Hash, ArrowLeft } from 'lucide-react';
import { deleteChannel, updateChannel } from '../services/api';
import socket from '../services/socket';
import './styles/ChatHeader.css';

function ChatHeader({
	// Channel mode props
	channelId,
	channelLabel,
	instituteId,
	onChannelDeleted,
	onChannelRenamed,
	isAdmin,
	// P2P mode props
	isP2P,
	otherUsername,
	onCloseP2P,
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const [deleting,    setDeleting]    = useState(false);
	const [error,       setError]       = useState('');
	const [editing,     setEditing]     = useState(false);
	const [nameInput,   setNameInput]   = useState(channelLabel || '');
	const [saving,      setSaving]      = useState(false);
	const [displayName, setDisplayName] = useState(channelLabel || '');

	const inputRef     = useRef(null);
	const channelIdRef = useRef(channelId);

	useEffect(() => { channelIdRef.current = channelId; }, [channelId]);

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

	// Listen for real-time renames/deletes even if another admin triggers them.
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

		if (!trimmed) { setError('Channel name cannot be empty'); return; }
		if (trimmed === channelLabel) { setEditing(false); return; }

		setSaving(true);
		setError('');
		const res = await updateChannel(channelId, undefined, { name: trimmed });
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

	const handleKeyDown = useCallback((e) => {
		if (e.key === 'Enter')  handleEditSave();
		if (e.key === 'Escape') handleEditCancel();
	}, [handleEditSave, handleEditCancel]);

	const handleDeleteChannel = useCallback(async () => {
		setDeleting(true);
		setError('');
		try {
			const res = await deleteChannel(channelId, undefined);
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

	// ── P2P header ──────────────────────────────────────────────────────────
	if (isP2P) {
		return (
			<header className='chat-header chat-header--p2p'>
				<div className='chat-header-left'>
					{onCloseP2P && (
						<button
							className='chat-header-icon-btn chat-header-back'
							onClick={onCloseP2P}
							aria-label='Back to channels'
							title='Back'
						>
							<ArrowLeft size={16} strokeWidth={2} />
						</button>
					)}
					<div className='chat-header-p2p-avatar' aria-hidden='true'>
						{otherUsername?.[0]?.toUpperCase() || 'U'}
					</div>
					<div className='chat-header-p2p-info'>
						<span className='chat-header-name'>{otherUsername}</span>
						<span className='chat-header-p2p-sub'>Direct Message</span>
					</div>
				</div>
			</header>
		);
	}

	// ── Channel header ──────────────────────────────────────────────────────
	return (
		<header className='chat-header'>
			<div className='chat-header-left'>
				<Hash className='chat-header-hash' size={18} strokeWidth={2} aria-hidden='true' />

				{editing ? (
					<div className='chat-header-edit'>
						<input
							ref={inputRef}
							className='chat-header-input'
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
							onKeyDown={handleKeyDown}
							maxLength={64}
							disabled={saving}
							aria-label='Channel name'
							spellCheck={false}
						/>
						<button
							className='chat-header-icon-btn chat-header-save'
							onClick={handleEditSave}
							disabled={saving}
							aria-label='Save name'
							title='Save'
						>
							<Check size={14} strokeWidth={2.5} />
						</button>
						<button
							className='chat-header-icon-btn chat-header-cancel'
							onClick={handleEditCancel}
							disabled={saving}
							aria-label='Cancel editing'
							title='Cancel'
						>
							<X size={14} strokeWidth={2.5} />
						</button>
					</div>
				) : (
					<div className='chat-header-name-wrap'>
						<span className='chat-header-name'>{displayName || channelId}</span>
						{/* Rename only visible to admins */}
						{isAdmin && (
							<button
								className='chat-header-icon-btn chat-header-edit-btn'
								onClick={handleEditStart}
								aria-label='Rename channel'
								title='Rename channel'
							>
								<Pencil size={13} strokeWidth={2} />
							</button>
						)}
					</div>
				)}
			</div>

			<div className='chat-header-actions'>
				{error && <span className='chat-header-error'>{error}</span>}

				{/* Delete only visible to admins */}
				{isAdmin && !editing && (
					showConfirm ? (
						<div className='delete-confirm'>
							<span>Delete channel?</span>
							<button className='confirm-yes' onClick={handleDeleteChannel} disabled={deleting}>
								{deleting ? 'Deleting…' : 'Yes'}
							</button>
							<button className='confirm-no' onClick={() => setShowConfirm(false)}>
								No
							</button>
						</div>
					) : (
						<button
							className='channel-delete-btn'
							onClick={() => setShowConfirm(true)}
							title='Delete channel'
						>
							<Trash2 size={14} strokeWidth={2} aria-hidden='true' />
							Delete channel
						</button>
					)
				)}
			</div>
		</header>
	);
}

export default ChatHeader;