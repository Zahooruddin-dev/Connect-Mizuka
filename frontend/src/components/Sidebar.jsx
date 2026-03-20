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
	fetchUserChatrooms,
} from '../services/api';
import { fetchUnreadCounts, markRoomAsRead } from '../services/p2p-api';
import { useTheme } from '../hooks/useTheme';
import socket from '../services/socket';
import InstituteSidebar from './InstituteSidebar';
import CreateChannelModal from './CreateChannelModal';
import UserProfilePanel from './UserProfilePanel';
import Inbox from './Inbox';
function loadStoredChats() {
	try {
		const raw = localStorage.getItem('mizuka_recent_p2p_chats');
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

const iconBtnCls =
	'flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

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
	const { theme, toggle: toggleTheme } = useTheme();

	const activeInstituteRef = useRef(activeInstitute?.id);
	const activeChannelRef = useRef(activeChannel);
	const activeTabRef = useRef(activeTab);
	const activeP2PRef = useRef(activeP2P);
	const searchDebounce = useRef(null);
	const searchInputRef = useRef(null);
	const channelsRef = useRef(channels);

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
	useEffect(() => {
		if (activeInstitute?.id) setActiveTab('channels');
	}, [activeInstitute?.id]);
	useEffect(() => {
		channelsRef.current = channels;
	}, [channels]);
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

	useEffect(() => {
		if (!user?.id) return;
		fetchUserChatrooms()
			.then((rooms) => {
				if (!rooms.length) return;
				setRecentChats((prev) => {
					const byRoomId = Object.fromEntries(prev.map((c) => [c.roomId, c]));
					const merged = rooms.map((r) => {
						const existing = byRoomId[r.room_id];
						const entry = {
							id: r.other_user_id,
							username: r.other_username,
							email: r.other_email,
							role: r.other_role,
							profile_picture: r.other_profile_picture || null,
							roomId: r.room_id,
							lastChat: r.last_created_at || r.created_at,
							lastMessage: r.last_content
								? {
										content: r.last_content,
										created_at: r.last_created_at,
										fromMe: String(r.last_sender_id) === String(user.id),
									}
								: existing?.lastMessage || null,
						};
						return { ...(existing || {}), ...entry };
					});
					const backendRoomIds = new Set(rooms.map((r) => r.room_id));
					const localOnly = prev.filter((c) => !backendRoomIds.has(c.roomId));
					const combined = [...merged, ...localOnly].sort((a, b) => {
						const ta = a.lastMessage?.created_at ?? a.lastChat ?? 0;
						const tb = b.lastMessage?.created_at ?? b.lastChat ?? 0;
						return new Date(tb) - new Date(ta);
					});
					localStorage.setItem(
						'mizuka_recent_p2p_chats',
						JSON.stringify(combined),
					);
					return combined;
				});
			})
			.catch(() => {});
	}, [user?.id]);

	useEffect(() => {
		if (!activeInstitute?.id) return;
		const stored = loadStoredChats();
		if (!stored.length || stored.every((c) => c.profile_picture !== undefined))
			return;
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
			if (fromMe || activeP2PRef.current?.roomId === msg.chatroom_id) return;
			setRoomUnread((prev) => ({
				...prev,
				[msg.chatroom_id]: (prev[msg.chatroom_id] || 0) + 1,
			}));
		};
		socket.on('receive_p2p_message', handleP2PMessage);
		return () => socket.off('receive_p2p_message', handleP2PMessage);
	}, [user.id]);

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
			if (
				!channel?.id ||
				String(channel.institute_id) !== String(activeInstituteRef.current)
			)
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

	const handleSearchInput = useCallback(
		(val) => {
			setSearchTerm(val);
			clearTimeout(searchDebounce.current);
			if (!val.trim() || val.length < 2 || !channels.length) {
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

	const tabs = [
		{ key: 'channels', Icon: Hash, label: 'Channels' },
		{ key: 'inbox', Icon: InboxIcon, label: 'Inbox' },
	];

	return (
		<>
			<div
				className={`fixed inset-0 bg-black/40 z-40 touch-none md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
				onClick={onClose}
				aria-hidden='true'
				onTouchStart={(e) => e.stopPropagation()}
			/>

			<aside
				className={`fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:z-auto md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
				aria-label='Navigation'
			>
				<div className='flex items-center justify-between px-3 pt-4 pb-3 shrink-0'>
					<div className='flex items-center gap-2'>
						<span className='flex items-baseline gap-0.5' aria-label='Mizuka'>
							<span
								className='text-[22px] font-semibold text-teal-400 leading-none tracking-[-1.5px]'
								aria-hidden='true'
							>
								M
							</span>
							<span
								className='text-[18px] font-light text-[var(--text-primary)] tracking-[-0.5px]'
								aria-hidden='true'
							>
								izuka
							</span>
						</span>
						<span
							className='w-1.5 h-1.5 rounded-full bg-teal-500 opacity-70 mb-0.5'
							aria-hidden='true'
						/>
					</div>
					{onClose && (
						<button
							className={`${iconBtnCls} md:hidden`}
							onClick={onClose}
							aria-label='Close navigation'
						>
							<X size={16} strokeWidth={2} />
						</button>
					)}
				</div>

				<div className='px-2 mb-2 shrink-0'>
					<button
						className='w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] text-left transition-[background] duration-150 hover:bg-[var(--border)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
						onClick={handleOpenPanel}
						aria-label='Manage institutes'
						aria-haspopup='dialog'
					>
						<span
							className='w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0'
							style={
								activeInstitute
									? {
											background:
												'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
											color: 'rgba(255,255,255,0.9)',
										}
									: { color: 'var(--text-ghost)' }
							}
							aria-hidden='true'
						>
							{activeInstitute ? (
								activeInstitute.label[0].toUpperCase()
							) : (
								<Building2 size={14} />
							)}
						</span>
						<div className='min-w-0 flex-1'>
							<div className='text-[12px] font-medium text-[var(--text-primary)] truncate'>
								{activeInstitute ? activeInstitute.label : 'No institute'}
							</div>
							<div className='text-[10px] text-[var(--text-ghost)]'>
								click to manage
							</div>
						</div>
						<ChevronDown
							size={12}
							strokeWidth={2}
							className='text-[var(--text-ghost)] shrink-0'
							aria-hidden='true'
						/>
					</button>
				</div>

				<div className='flex px-2 border-b border-[var(--border)] shrink-0'>
					{tabs.map(({ key, Icon, label }) => (
						<button
							key={key}
							className={`relative flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-[color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] ${activeTab === key ? 'text-[var(--text-secondary)]' : 'text-[var(--text-ghost)] hover:text-[var(--text-muted)]'}`}
							onClick={() => setActiveTab(key)}
						>
							<Icon size={12} strokeWidth={2} aria-hidden='true' />
							{label}
							{key === 'inbox' && unreadCount > 0 && (
								<span className='flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[var(--teal-600)] text-white text-[9px] font-semibold'>
									{unreadCount > 99 ? '99+' : unreadCount}
								</span>
							)}
							{activeTab === key && (
								<span
									className='absolute bottom-[-1px] left-0 right-0 h-px bg-[var(--teal-600)]'
									aria-hidden='true'
								/>
							)}
						</button>
					))}
				</div>

				<div className='flex-1 overflow-hidden flex flex-col pt-3'>
					{activeTab === 'channels' && (
						<div className='flex flex-col flex-1 overflow-hidden'>
							{channels.length > 0 ? (
								<>
									<div className='flex items-center justify-between px-3 mb-1.5 shrink-0'>
										<span
											className='text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)]'
											id='channels-label'
										>
											Channels
										</span>
										<div className='flex items-center gap-0.5'>
											<button
												className={iconBtnCls}
												onClick={() => setSearchOpen((v) => !v)}
												aria-label='Search messages'
												aria-expanded={searchOpen}
												title='Search messages'
											>
												<Search size={12} strokeWidth={2.5} />
											</button>
											{isAdmin && (
												<button
													className={iconBtnCls}
													onClick={handleOpenCreate}
													aria-label='Create channel'
													title='Create channel'
												>
													<Plus size={12} strokeWidth={2.5} />
												</button>
											)}
										</div>
									</div>

									{searchOpen && (
										<div className='mx-2 mb-2 shrink-0'>
											<div className='flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 transition-[border-color] duration-150 focus-within:border-[var(--teal-700)]'>
												<Search
													size={12}
													className='text-[var(--text-ghost)] shrink-0'
												/>
												<input
													ref={searchInputRef}
													type='text'
													className='flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]'
													style={{ fontSize: '16px' }}
													placeholder='Search messages…'
													value={searchTerm}
													onChange={(e) => handleSearchInput(e.target.value)}
													onKeyDown={(e) =>
														e.key === 'Escape' && handleCloseSearch()
													}
												/>
												{searchTerm && (
													<button
														className={iconBtnCls}
														onClick={handleCloseSearch}
														aria-label='Clear search'
													>
														<X size={11} />
													</button>
												)}
											</div>
											{searchLoading && (
												<p className='text-[12px] text-[var(--text-ghost)] px-1 py-1.5'>
													Searching…
												</p>
											)}
											{!searchLoading &&
												searchTerm.length >= 2 &&
												searchResults.length === 0 && (
													<p className='text-[12px] text-[var(--text-ghost)] px-1 py-1.5'>
														No results found
													</p>
												)}
											{searchResults.length > 0 && (
												<ul className='mt-1 flex flex-col gap-0.5'>
													{searchResults.map((result) => {
														const ch = channels.find(
															(c) => String(c.id) === String(result.channel_id),
														);
														return (
															<li key={result.id}>
																<button
																	className='w-full flex flex-col gap-0.5 px-2.5 py-2 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
																	onClick={() =>
																		handleSearchResultClick(result)
																	}
																	title={result.content}
																>
																	{ch && (
																		<span className='flex items-center gap-1 text-[10px] text-[var(--text-ghost)]'>
																			<Hash
																				size={9}
																				strokeWidth={2.5}
																				aria-hidden='true'
																			/>
																			{ch.name}
																		</span>
																	)}
																	<span className='text-[12px] text-[var(--text-muted)] leading-snug line-clamp-2'>
																		{result.content?.length > 80
																			? result.content.slice(0, 80) + '…'
																			: result.content}
																	</span>
																	{result.username && (
																		<span className='text-[10px] text-[var(--text-ghost)]'>
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
										className='flex-1 overflow-y-auto px-1 flex flex-col gap-0.5'
										aria-labelledby='channels-label'
										role='list'
									>
										{channels.map((ch) => (
											<li key={ch.id} role='listitem'>
												<button
													className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] ${activeChannel === ch.id ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]'}`}
													onClick={() => onChannelSelect(ch)}
													aria-current={
														activeChannel === ch.id ? 'page' : undefined
													}
												>
													<Hash
														size={13}
														strokeWidth={2}
														className='shrink-0'
														aria-hidden='true'
													/>
													<span className='truncate'>{ch.name}</span>
												</button>
											</li>
										))}
									</ul>
								</>
							) : (
								<div className='flex flex-col items-center justify-center gap-3 flex-1 px-4 text-center'>
									<Building2
										size={28}
										strokeWidth={1}
										className='text-[var(--text-ghost)]'
										aria-hidden='true'
									/>
									<p className='text-[12px] text-[var(--text-ghost)] leading-relaxed'>
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
						<div className='flex flex-col items-center justify-center gap-3 flex-1 px-4 text-center'>
							<Building2
								size={28}
								strokeWidth={1}
								className='text-[var(--text-ghost)]'
								aria-hidden='true'
							/>
							<p className='text-[12px] text-[var(--text-ghost)] leading-relaxed'>
								Select an institute to search members
							</p>
						</div>
					)}
				</div>

				<div className='border-t border-[var(--border)] px-2 py-2 shrink-0'>
					<div className='flex items-center gap-1'>
						<div
							className='flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-[background] duration-150 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={handleOpenProfile}
							role='button'
							tabIndex={0}
							onKeyDown={handleProfileKeyDown}
							aria-label='Open your profile'
						>
							{user.profile_picture ? (
								<img
									src={user.profile_picture}
									alt={user.username}
									className='w-7 h-7 rounded-full object-cover shrink-0'
								/>
							) : (
								<div
									className='w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0'
									style={{
										background:
											'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
									}}
									aria-hidden='true'
								>
									{user.username[0].toUpperCase()}
								</div>
							)}
							<div className='min-w-0'>
								<div className='text-[12px] font-medium text-[var(--text-primary)] truncate'>
									{user.username}
								</div>
								<div className='text-[10px] text-[var(--text-ghost)] capitalize'>
									{user.role || 'member'}
								</div>
							</div>
						</div>
						<button
							className='flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={toggleTheme}
							aria-label={
								theme === 'dark'
									? 'Switch to light mode'
									: 'Switch to dark mode'
							}
							title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
						>
							{theme === 'dark' ? (
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<circle cx='12' cy='12' r='5' />
									<line x1='12' y1='1' x2='12' y2='3' />
									<line x1='12' y1='21' x2='12' y2='23' />
									<line x1='4.22' y1='4.22' x2='5.64' y2='5.64' />
									<line x1='18.36' y1='18.36' x2='19.78' y2='19.78' />
									<line x1='1' y1='12' x2='3' y2='12' />
									<line x1='21' y1='12' x2='23' y2='12' />
									<line x1='4.22' y1='19.78' x2='5.64' y2='18.36' />
									<line x1='18.36' y1='5.64' x2='19.78' y2='4.22' />
								</svg>
							) : (
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
								</svg>
							)}
						</button>
						<button
							className='flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={onLogout}
							aria-label='Sign out'
							title='Sign out'
						>
							<LogOut size={14} strokeWidth={2} aria-hidden='true' />
						</button>
					</div>
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
