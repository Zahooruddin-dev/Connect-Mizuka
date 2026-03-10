import { useState, useEffect, useRef, useCallback } from 'react';
import {
	Hash,
	Plus,
	LogOut,
	ChevronDown,
	X,
	Building2,
	Inbox as InboxIcon,
} from 'lucide-react';
import { fetchChannelsByInstitute, createChannel } from '../services/api';
import { fetchUnreadCounts } from '../services/p2p-api';
import socket from '../services/socket';
import InstitutePanel from './InstitutePanel';
import CreateChannelModal from './CreateChannelModal';
import UserProfilePanel from './UserProfilePanel';
import Inbox from './Inbox';
import './styles/Sidebar.css';

function Sidebar({
	activeChannel,
	onChannelSelect,
	user,
	onLogout,
	isAdmin,
	onClose,
	isOpen,
	activeInstitute,
	onStartP2P,
	activeP2P,
}) {
	const [panelOpen, setPanelOpen] = useState(false);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [channels, setChannels] = useState([]);
	const [activeTab, setActiveTab] = useState('channels');
	const [unreadCount, setUnreadCount] = useState(0);
	const [onlineUsers, setOnlineUsers] = useState(new Set());

	// Refs let socket handlers always read current values without being
	// recreated or added to effect dependency arrays.
	const activeInstituteRef = useRef(activeInstitute?.id);
	const activeChannelRef = useRef(activeChannel);
	const activeTabRef = useRef(activeTab);
	const activeP2PRef = useRef(activeP2P);

	useEffect(() => {
		activeInstituteRef.current = activeInstitute?.id;
	}, [activeInstitute]);
	useEffect(() => {
		activeChannelRef.current = activeChannel;
	}, [activeChannel]);
	useEffect(() => {
		activeTabRef.current = activeTab;
	}, [activeTab]);
	useEffect(() => {
		activeP2PRef.current = activeP2P;
	}, [activeP2P]);

	// Stable reference, safe to pass as a prop to Inbox without causing
	// re-renders every time Sidebar re-renders.
	const updateUnreadCount = useCallback(async () => {
		if (!user?.id) return;
		try {
			const counts = await fetchUnreadCounts(user.id);
			const total = counts.reduce((sum, r) => sum + Number(r.unread_count), 0);
			setUnreadCount(total);
		} catch {
			setUnreadCount(0);
		}
	}, [user?.id]);

	// Register presence on mount / user change.
	useEffect(() => {
		if (!user?.id) return;
		socket.emit('user_online', user.id);
		socket.emit('get_online_users');
	}, [user?.id]);

	// Initial unread count fetch.
	useEffect(() => {
		updateUnreadCount();
	}, [updateUnreadCount]);

	// Online/offline presence events.
	useEffect(() => {
		const handleStatus = ({ userId, status }) => {
			setOnlineUsers((prev) => {
				const next = new Set(prev);
				if (status === 'online') next.add(String(userId));
				else next.delete(String(userId));
				return next;
			});
		};
		const handleOnlineList = (userIds) =>
			setOnlineUsers(new Set(userIds.map(String)));

		socket.on('update_user_status', handleStatus);
		socket.on('online_users_list', handleOnlineList);
		return () => {
			socket.off('update_user_status', handleStatus);
			socket.off('online_users_list', handleOnlineList);
		};
	}, []);

	// Increment sidebar badge on incoming P2P messages.
	useEffect(() => {
		const handleP2PMessage = (msg) => {
			if (String(msg.sender_id) === String(user.id)) return;
			if (
				activeTabRef.current !== 'inbox' ||
				activeP2PRef.current?.roomId !== msg.chatroom_id
			) {
				setUnreadCount((prev) => prev + 1);
			}
		};
		socket.on('receive_p2p_message', handleP2PMessage);
		return () => socket.off('receive_p2p_message', handleP2PMessage);
	}, [user.id]);

	// Re-sync unread count from DB when switching to the inbox tab.
	useEffect(() => {
		if (activeTab === 'inbox') updateUnreadCount();
	}, [activeTab, updateUnreadCount]);

	// Fetch channels and join institute room when the institute changes.
	useEffect(() => {
		if (!activeInstitute) {
			setChannels([]);
			return;
		}
		fetchChannelsByInstitute(activeInstitute.id)
			.then((res) => setChannels(res.data?.channels || res.channels || []))
			.catch(() => setChannels([]));

		socket.emit('join_institute_room', activeInstitute.id);
	}, [activeInstitute]);

	// Channel socket events, use refs for activeChannel and onChannelSelect
	// so this effect never needs to re-register just because those values changed.
	useEffect(() => {
		const handleSocketDeleted = ({ channelId }) => {
			if (!channelId) return;
			setChannels((prev) =>
				prev.filter((c) => String(c.id) !== String(channelId)),
			);
			if (String(activeChannelRef.current) === String(channelId)) {
				onChannelSelect(null);
			}
		};

		const handleSocketRenamed = ({ channel }) => {
			if (!channel?.id) return;
			setChannels((prev) =>
				prev.map((c) =>
					String(c.id) === String(channel.id)
						? { ...c, name: channel.name }
						: c,
				),
			);
			if (String(activeChannelRef.current) === String(channel.id)) {
				onChannelSelect(channel);
			}
		};

		const handleChannelCreated = ({ channel }) => {
			if (!channel?.id) return;
			if (String(channel.institute_id) !== String(activeInstituteRef.current))
				return;
			setChannels((prev) => {
				if (prev.some((c) => String(c.id) === String(channel.id))) return prev;
				return [...prev, channel];
			});
		};

		socket.on('channel_deleted', handleSocketDeleted);
		socket.on('channel_renamed', handleSocketRenamed);
		socket.on('channel_created', handleChannelCreated);
		return () => {
			socket.off('channel_deleted', handleSocketDeleted);
			socket.off('channel_renamed', handleSocketRenamed);
			socket.off('channel_created', handleChannelCreated);
		};
		// onChannelSelect is stable (memoized in App). No other deps needed
		// because activeChannel and activeInstitute are read via refs.
	}, [onChannelSelect]);

	const handleCreateChannel = useCallback(
		async (name) => {
			const res = await createChannel(user.id, activeInstitute.id, name);
			if (res.channel) {
				socket.emit('channel_created', {
					channel: res.channel,
					instituteId: activeInstitute.id,
				});
				setChannels((prev) => [...prev, res.channel]);
				return {};
			}
			return { error: res.message || 'Failed to create channel' };
		},
		[user.id, activeInstitute?.id],
	);

	const handleOpenPanel = useCallback(() => setPanelOpen(true), []);
	const handleClosePanel = useCallback(() => setPanelOpen(false), []);
	const handleOpenCreate = useCallback(() => setCreateModalOpen(true), []);
	const handleCloseCreate = useCallback(() => setCreateModalOpen(false), []);
	const handleOpenProfile = useCallback(() => setIsProfileOpen(true), []);
	const handleCloseProfile = useCallback(() => setIsProfileOpen(false), []);
	const handleProfileKeyDown = useCallback((e) => {
		if (e.key === 'Enter' || e.key === ' ') setIsProfileOpen(true);
	}, []);

	return (
		<>
			{isOpen && (
				<div
					className='sidebar-backdrop'
					onClick={onClose}
					aria-hidden='true'
				/>
			)}

			<aside
				className={`sidebar${isOpen ? ' open' : ''}`}
				aria-label='Navigation'
			>
				<div className='sidebar-header'>
					<div className='sidebar-brand-wrap'>
						<span className='sidebar-brand' aria-label='Mizuka'>
							<span className='sidebar-brand-m' aria-hidden='true'>
								M
							</span>
							izuka
						</span>
						<span className='sidebar-status' aria-hidden='true' />
					</div>
					{onClose && (
						<button
							className='sidebar-icon-btn sidebar-close-btn'
							onClick={onClose}
							aria-label='Close navigation'
						>
							<X size={18} strokeWidth={2} />
						</button>
					)}
				</div>

				<button
					className='sidebar-institute-btn'
					onClick={handleOpenPanel}
					aria-label='Manage institutes'
					aria-haspopup='dialog'
				>
					<span className='sidebar-institute-icon' aria-hidden='true'>
						{activeInstitute ? (
							activeInstitute.label[0].toUpperCase()
						) : (
							<Building2 size={14} />
						)}
					</span>
					<span className='sidebar-institute-info'>
						<span className='sidebar-institute-label'>
							{activeInstitute ? activeInstitute.label : 'No institute'}
						</span>
						<span className='sidebar-institute-hint'>click to manage</span>
					</span>
					<ChevronDown
						className='sidebar-institute-chevron'
						size={14}
						strokeWidth={2}
						aria-hidden='true'
					/>
				</button>

				<div className='sidebar-tabs'>
					<button
						className={`sidebar-tab ${activeTab === 'channels' ? 'active' : ''}`}
						onClick={() => setActiveTab('channels')}
					>
						<Hash size={14} />
						Channels
					</button>
					<button
						className={`sidebar-tab ${activeTab === 'inbox' ? 'active' : ''}`}
						onClick={() => setActiveTab('inbox')}
					>
						<InboxIcon size={14} />
						Inbox
						{unreadCount > 0 && (
							<span className='sidebar-tab-badge'>
								{unreadCount > 99 ? '99+' : unreadCount}
							</span>
						)}
					</button>
				</div>

				{activeTab === 'channels' && (
					<div className='sidebar-section'>
						{channels.length > 0 ? (
							<>
								<div className='sidebar-section-header'>
									<span className='sidebar-section-label' id='channels-label'>
										Channels
									</span>
									{isAdmin && (
										<button
											className='sidebar-add-channel-btn'
											title='Create channel'
											aria-label='Create channel'
											onClick={handleOpenCreate}
										>
											<Plus size={13} strokeWidth={2.5} />
										</button>
									)}
								</div>
								<ul
									className='sidebar-channels'
									aria-labelledby='channels-label'
									role='list'
								>
									{channels.map((ch) => (
										<li key={ch.id} role='listitem'>
											<button
												className={`sidebar-channel-btn${activeChannel === ch.id ? ' active' : ''}`}
												onClick={() => onChannelSelect(ch)}
												aria-current={
													activeChannel === ch.id ? 'page' : undefined
												}
											>
												<Hash
													className='sidebar-hash'
													size={14}
													strokeWidth={2}
													aria-hidden='true'
												/>
												<span>{ch.name}</span>
											</button>
										</li>
									))}
								</ul>
							</>
						) : (
							<div className='sidebar-empty'>
								<Building2
									size={30}
									strokeWidth={1}
									className='sidebar-empty-icon'
									aria-hidden='true'
								/>
								<p className='sidebar-no-channels'>
									Select or join an institute to see channels.
								</p>
							</div>
						)}
					</div>
				)}

				{activeTab === 'inbox' && activeInstitute && (
					<Inbox
						activeInstitute={activeInstitute}
						currentUser={user}
						onStartP2P={onStartP2P}
						onlineUsers={onlineUsers}
						activeP2P={activeP2P}
						onUnreadUpdate={updateUnreadCount}
					/>
				)}

				{activeTab === 'inbox' && !activeInstitute && (
					<div className='sidebar-empty'>
						<Building2 size={30} strokeWidth={1} aria-hidden='true' />
						<p className='sidebar-no-channels'>
							Select an institute to search members
						</p>
					</div>
				)}

				<div className='sidebar-footer'>
					<div
						className='sidebar-user'
						onClick={handleOpenProfile}
						role='button'
						tabIndex={0}
						onKeyDown={handleProfileKeyDown}
					>
						<div className='sidebar-avatar' aria-hidden='true'>
							{user.username[0].toUpperCase()}
						</div>
						<div className='sidebar-user-info'>
							<span className='sidebar-username'>{user.username}</span>
							<span className='sidebar-user-role'>{user.role || 'member'}</span>
						</div>
					</div>
					<button
						className='sidebar-icon-btn sidebar-logout'
						onClick={onLogout}
						aria-label='Sign out'
						title='Sign out'
					>
						<LogOut size={16} strokeWidth={2} aria-hidden='true' />
					</button>
				</div>
			</aside>

			{panelOpen && <InstitutePanel onClose={handleClosePanel} />}
			{createModalOpen && (
				<CreateChannelModal
					onClose={handleCloseCreate}
					onConfirm={handleCreateChannel}
				/>
			)}
			{isProfileOpen && (
				<UserProfilePanel userId={user.id} onClose={handleCloseProfile} />
			)}
		</>
	);
}

export default Sidebar;
