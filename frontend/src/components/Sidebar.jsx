import { useState, useEffect, useRef, useCallback } from 'react';
import {
	Hash,
	Plus,
	LogOut,
	ChevronDown,
	X,
	Building2,
	Inbox as InboxIcon,
	Search,
} from 'lucide-react';
import {
	fetchChannelsByInstitute,
	createChannel,
	searchChannelMessages,
	getInstituteMembers,
} from '../services/api';
import { fetchUnreadCounts, markRoomAsRead } from '../services/p2p-api';
import socket from '../services/socket';
import InstituteSidebar from './InstituteSidebar';
import CreateChannelModal from './CreateChannelModal';
import UserProfilePanel from './UserProfilePanel';
import Inbox from './Inbox';
import './styles/Sidebar.css';

function loadStoredChats() {
	try {
		const raw = localStorage.getItem('mizuka_recent_p2p_chats');
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

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
	onJumpToMessage,
	onJumpToP2PMessage,
	onChannelsLoaded,
}) {
	const [panelOpen, setPanelOpen] = useState(false);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [channels, setChannels] = useState([]);
	const [activeTab, setActiveTab] = useState('channels');
	const [unreadCount, setUnreadCount] = useState(0);
	const [onlineUsers, setOnlineUsers] = useState(new Set());
	const [recentChats, setRecentChats] = useState(loadStoredChats);
	const [roomUnread, setRoomUnread] = useState({});

	const [searchOpen, setSearchOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);

	const activeInstituteRef = useRef(activeInstitute?.id);
	const activeChannelRef = useRef(activeChannel);
	const activeTabRef = useRef(activeTab);
	const activeP2PRef = useRef(activeP2P);
	const searchDebounce = useRef(null);
	const searchInputRef = useRef(null);

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

	useEffect(() => {
		if (activeP2P?.roomId) setActiveTab('inbox');
	}, [activeP2P?.roomId]);

	useEffect(() => {
		if (searchOpen) searchInputRef.current?.focus();
	}, [searchOpen]);

	useEffect(() => {
		setSearchOpen(false);
		setSearchTerm('');
		setSearchResults([]);
	}, [activeChannel, activeTab]);

	// ── Unread count (from API) ────────────────────────────────────────────
	const refreshUnreadCount = useCallback(() => {
		if (!user?.id) return;
		fetchUnreadCounts(user.id)
			.then((counts) => {
				const map = {};
				counts.forEach((r) => {
					map[r.chatroom_id] = Number(r.unread_count);
				});
				setRoomUnread(map);
				setUnreadCount(Object.values(map).reduce((s, n) => s + n, 0));
			})
			.catch(() => {});
	}, [user?.id]);

	// ── On mount: join personal room, re-join all known P2P rooms, fetch unread ──
	useEffect(() => {
		if (!user?.id) return;
		socket.emit('user_online', user.id);
		socket.emit('get_online_users');
		socket.emit('join_user_room', user.id);

		fetchUnreadCounts(user.id)
			.then((counts) => {
				const map = {};
				counts.forEach((r) => {
					map[r.chatroom_id] = Number(r.unread_count);
					socket.emit('join_p2p', r.chatroom_id);
				});
				setRoomUnread(map);
				setUnreadCount(Object.values(map).reduce((s, n) => s + n, 0));
			})
			.catch(() => {});

		loadStoredChats().forEach((c) => socket.emit('join_p2p', c.roomId));
	}, [user?.id]);

	// Enrich stored chats with profile_picture if missing (handles old sessions)
	useEffect(() => {
		if (!activeInstitute?.id) return;
		const stored = loadStoredChats();
		if (!stored.length) return;
		if (stored.every((c) => c.profile_picture !== undefined)) return;
		getInstituteMembers(activeInstitute.id)
			.then((members) => {
				if (!members?.length) return;
				const byId = Object.fromEntries(members.map((m) => [String(m.id), m]));
				setRecentChats((prev) => {
					const enriched = prev.map((c) => {
						if (c.profile_picture !== undefined) return c;
						const member = byId[String(c.id)];
						return member
							? { ...c, profile_picture: member.profile_picture || null }
							: { ...c, profile_picture: null };
					});
					localStorage.setItem(
						'mizuka_recent_p2p_chats',
						JSON.stringify(enriched),
					);
					return enriched;
				});
			})
			.catch(() => {});
	}, [activeInstitute?.id]);

	// ── Clear unread badge when a P2P chat is opened ──────────────────────
	useEffect(() => {
		if (!activeP2P?.roomId || !user?.id) return;
		markRoomAsRead(activeP2P.roomId, user.id)
			.then(() => refreshUnreadCount())
			.catch(() => {});
		setRoomUnread((prev) => {
			const next = { ...prev };
			delete next[activeP2P.roomId];
			return next;
		});
		setUnreadCount((prev) =>
			Math.max(0, prev - (roomUnread[activeP2P.roomId] || 0)),
		);
	}, [activeP2P?.roomId, user?.id]);

	// ── Online status ──────────────────────────────────────────────────────
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

	// ── Incoming P2P messages — always-on listener ─────────────────────────
	useEffect(() => {
		const handleP2PMessage = (msg) => {
			const fromMe = String(msg.sender_id) === String(user.id);

			socket.emit('join_p2p', msg.chatroom_id);

			setRecentChats((prev) => {
				const existing = prev.find((c) => c.roomId === msg.chatroom_id);
				if (!existing && fromMe) return prev;

				const entry = existing
					? {
							...existing,
							lastMessage: {
								content: msg.content,
								created_at: msg.created_at,
								fromMe,
							},
						}
					: {
							id: msg.sender_id,
							username: msg.username,
							profile_picture: msg.profile_picture || null,
							roomId: msg.chatroom_id,
							lastChat: msg.created_at,
							lastMessage: {
								content: msg.content,
								created_at: msg.created_at,
								fromMe: false,
							},
						};

				const idx = prev.findIndex((c) => c.roomId === entry.roomId);
				const next =
					idx !== -1
						? prev.map((c, i) => (i === idx ? entry : c))
						: [entry, ...prev].slice(0, 20);
				const sorted = [...next].sort((a, b) => {
					const ta = a.lastMessage?.created_at ?? a.lastChat ?? 0;
					const tb = b.lastMessage?.created_at ?? b.lastChat ?? 0;
					return new Date(tb) - new Date(ta);
				});
				localStorage.setItem('mizuka_recent_p2p_chats', JSON.stringify(sorted));
				return sorted;
			});

			if (fromMe) return;
			if (activeP2PRef.current?.roomId === msg.chatroom_id) return;

			setRoomUnread((prev) => ({
				...prev,
				[msg.chatroom_id]: (prev[msg.chatroom_id] || 0) + 1,
			}));
			fetchUnreadCounts(user.id)
				.then((counts) => {
					const total = counts.reduce((s, r) => s + Number(r.unread_count), 0);
					setUnreadCount(total);
				})
				.catch(() => {});
		};

		socket.on('receive_p2p_message', handleP2PMessage);
		return () => socket.off('receive_p2p_message', handleP2PMessage);
	}, [user.id]);

	// ── Channels ───────────────────────────────────────────────────────────
	useEffect(() => {
		if (!activeInstitute) {
			setChannels([]);
			return;
		}
		fetchChannelsByInstitute(activeInstitute.id)
			.then((res) => {
				const fetched = res.data?.channels || res.channels || [];
				setChannels(fetched);
				onChannelsLoaded?.(fetched);
			})
			.catch(() => setChannels([]));
		socket.emit('join_institute_room', activeInstitute.id);
	}, [activeInstitute]);

	useEffect(() => {
		const handleSocketDeleted = ({ channelId }) => {
			if (!channelId) return;
			setChannels((prev) =>
				prev.filter((c) => String(c.id) !== String(channelId)),
			);
			if (String(activeChannelRef.current) === String(channelId))
				onChannelSelect(null);
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
			if (String(activeChannelRef.current) === String(channel.id))
				onChannelSelect(channel);
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
	}, [onChannelSelect]);

	// ── Search ─────────────────────────────────────────────────────────────
	const handleSearchInput = useCallback(
		(val) => {
			setSearchTerm(val);
			clearTimeout(searchDebounce.current);
			if (!val.trim() || val.length < 2) {
				setSearchResults([]);
				return;
			}
			if (!channels.length) {
				setSearchResults([]);
				return;
			}
			setSearchLoading(true);
			searchDebounce.current = setTimeout(async () => {
				try {
					const settled = await Promise.allSettled(
						channels.map((ch) => searchChannelMessages(ch.id, val)),
					);
					const merged = settled.flatMap((r) =>
						r.status === 'fulfilled' ? r.value || [] : [],
					);
					merged.sort(
						(a, b) => new Date(b.created_at) - new Date(a.created_at),
					);
					setSearchResults(merged);
				} catch {
					setSearchResults([]);
				} finally {
					setSearchLoading(false);
				}
			}, 300);
		},
		[channels],
	);

	const handleSearchResultClick = useCallback(
		(result) => {
			const targetChannel = channels.find(
				(c) => String(c.id) === String(result.channel_id),
			);
			if (targetChannel) onChannelSelect(targetChannel);
			if (typeof onJumpToMessage === 'function')
				onJumpToMessage(result.channel_id, result.id);
			setSearchOpen(false);
			setSearchTerm('');
			setSearchResults([]);
		},
		[channels, onChannelSelect, onJumpToMessage],
	);

	const handleCloseSearch = useCallback(() => {
		setSearchOpen(false);
		setSearchTerm('');
		setSearchResults([]);
	}, []);

	useEffect(() => () => clearTimeout(searchDebounce.current), []);

	const handleCreateChannel = useCallback(
		async (name) => {
			const res = await createChannel(activeInstitute.id, name);
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
									<div className='sidebar-section-actions'>
										<button
											className='sidebar-add-channel-btn'
											title='Search messages'
											aria-label='Search messages'
											onClick={() => setSearchOpen((v) => !v)}
											aria-expanded={searchOpen}
										>
											<Search size={13} strokeWidth={2.5} />
										</button>
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
								</div>

								{searchOpen && (
									<div className='sidebar-search-wrap'>
										<div className='sidebar-search-input-row'>
											<Search size={13} className='sidebar-search-icon' />
											<input
												ref={searchInputRef}
												type='text'
												className='sidebar-search-input'
												placeholder='Search messages…'
												value={searchTerm}
												onChange={(e) => handleSearchInput(e.target.value)}
												onKeyDown={(e) =>
													e.key === 'Escape' && handleCloseSearch()
												}
											/>
											{searchTerm && (
												<button
													className='sidebar-search-clear'
													onClick={handleCloseSearch}
													aria-label='Clear search'
												>
													<X size={12} />
												</button>
											)}
										</div>
										{searchLoading && (
											<div className='sidebar-search-status'>Searching…</div>
										)}
										{!searchLoading &&
											searchTerm.length >= 2 &&
											searchResults.length === 0 && (
												<div className='sidebar-search-status'>
													No results found
												</div>
											)}
										{searchResults.length > 0 && (
											<ul className='sidebar-search-results'>
												{searchResults.map((result) => {
													const ch = channels.find(
														(c) => String(c.id) === String(result.channel_id),
													);
													return (
														<li key={result.id}>
															<button
																className='sidebar-search-result'
																onClick={() => handleSearchResultClick(result)}
																title={result.content}
															>
																{ch && (
																	<span className='sidebar-search-result-channel'>
																		<Hash size={10} strokeWidth={2.5} />
																		{ch.name}
																	</span>
																)}
																<span className='sidebar-search-result-content'>
																	{result.content?.length > 80
																		? result.content.slice(0, 80) + '…'
																		: result.content}
																</span>
																{result.username && (
																	<span className='sidebar-search-result-meta'>
																		{result.username}
																	</span>
																)}
															</button>
														</li>
													);
												})}
											</ul>
										)}
									</div>
								)}

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
						onUnreadUpdate={refreshUnreadCount}
						onJumpToP2PMessage={onJumpToP2PMessage}
						recentChats={recentChats}
						setRecentChats={setRecentChats}
						roomUnread={roomUnread}
						setRoomUnread={setRoomUnread}
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
						{user.profile_picture ? (
							<img
								src={user.profile_picture}
								alt={user.username}
								className='sidebar-avatar sidebar-avatar--img'
							/>
						) : (
							<div className='sidebar-avatar' aria-hidden='true'>
								{user.username[0].toUpperCase()}
							</div>
						)}
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

			{panelOpen && (
				<InstituteSidebar onClose={handleClosePanel} onStartP2P={onStartP2P} />
			)}
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
