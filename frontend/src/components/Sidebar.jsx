import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Hash,
  Plus,
  ChevronDown,
  X,
  Building2,
  Inbox as InboxIcon,
  Search,
} from 'lucide-react';
import {
  fetchChannelsByInstitute,
  createChannel,
  searchAllChannels,
  getInstituteMembers,
  fetchUserChatrooms,
} from '../services/api';
import { fetchUnreadCounts, markRoomAsRead } from '../services/p2p-api';
import { useTheme } from '../hooks/useTheme';
import socket from '../services/socket';
import SidebarContent from './SidebarContent';

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
  const { theme, toggle: toggleTheme } = useTheme();

  const activeInstituteRef = useRef(activeInstitute?.id);
  const activeChannelRef = useRef(activeChannel);
  const activeTabRef = useRef(activeTab);
  const activeP2PRef = useRef(activeP2P);
  const searchDebounce = useRef(null);
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

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (e) => {
			if (e.key === 'Escape') onClose?.();
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [isOpen, onClose]);


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
										type: r.last_type || 'text',
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
								type: msg.type || 'text',
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
								type: msg.type || 'text',
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

	const handleSearchInput = useCallback((val) => {
		setSearchTerm(val);
		clearTimeout(searchDebounce.current);

		if (!val.trim() || val.length < 2) {
			setSearchResults([]);
			return;
		}

		setSearchLoading(true);
		searchDebounce.current = setTimeout(async () => {
			const currentChannels = channelsRef.current;
			if (!currentChannels.length) {
				setSearchLoading(false);
				return;
			}

			try {
				const results = await searchAllChannels(
					currentChannels.map((c) => c.id),
					val,
				);
				results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				setSearchResults(results);
			} catch {
				setSearchResults([]);
			} finally {
				setSearchLoading(false);
			}
		}, 300);
	}, []);

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


	const tabs = [
		{ key: 'channels', Icon: Hash, label: 'Channels' },
		{ key: 'inbox', Icon: InboxIcon, label: 'Inbox' },
	];

 return (
  <SidebarContent
      isOpen={isOpen}
      onClose={onClose}
      activeInstitute={activeInstitute}
      onOpenPanel={() => setPanelOpen(true)}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      unreadCount={unreadCount}
      channels={channels}
      searchOpen={searchOpen}
      onSearchToggle={() => setSearchOpen(v => !v)}
      searchTerm={searchTerm}
      onSearchChange={handleSearchInput}
      onSearchClear={handleCloseSearch}
      searchLoading={searchLoading}
      searchResults={searchResults}
      onSearchResultClick={handleSearchResultClick}
      isAdmin={isAdmin}
      onCreateChannel={() => setCreateModalOpen(true)}
      activeChannel={activeChannel}
      onChannelSelect={onChannelSelect}
      user={user}
      onOpenProfile={() => setIsProfileOpen(true)}
      onToggleTheme={toggleTheme}
      theme={theme}
      onLogout={onLogout}
      panelOpen={panelOpen}
      onClosePanel={() => setPanelOpen(false)}
      onStartP2P={onStartP2P}
      createModalOpen={createModalOpen}
      onCloseCreate={() => setCreateModalOpen(false)}
      handleCreateChannel={handleCreateChannel}
      isProfileOpen={isProfileOpen}
      onCloseProfile={() => setIsProfileOpen(false)}
      onlineUsers={onlineUsers}
      activeP2P={activeP2P}
      onUnreadUpdate={refreshUnreadCount}
      onJumpToP2PMessage={onJumpToP2PMessage}
      recentChats={recentChats}
      setRecentChats={setRecentChats}
      roomUnread={roomUnread}
      setRoomUnread={setRoomUnread}
    />
  );
}

export default Sidebar;
