import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MessageCircle, MessagesSquare } from 'lucide-react';
import { searchInstituteMembers, searchP2PMessages } from '../services/api';
import {
	getOrCreateP2PRoom,
	fetchUnreadCounts,
	markRoomAsRead,
} from '../services/p2p-api';
import socket from '../services/socket';
import './styles/Inbox.css';

function Inbox({
	activeInstitute,
	currentUser,
	onStartP2P,
	onlineUsers = new Set(),
	activeP2P,
	onUnreadUpdate,
	onJumpToP2PMessage,
}) {
	const [searchTerm,    setSearchTerm]    = useState('');
	const [results,       setResults]       = useState([]);
	const [recentChats,   setRecentChats]   = useState([]);
	const [loading,       setLoading]       = useState(false);
	const [startingChat,  setStartingChat]  = useState(null);
	const [roomUnread,    setRoomUnread]    = useState({});

	// Message search state — separate from member search
	const [msgSearchOpen,    setMsgSearchOpen]    = useState(false);
	const [msgSearchTerm,    setMsgSearchTerm]    = useState('');
	const [msgSearchResults, setMsgSearchResults] = useState([]);
	const [msgSearchLoading, setMsgSearchLoading] = useState(false);

	const debounceTimer     = useRef(null);
	const msgDebounceTimer  = useRef(null);
	const msgSearchInputRef = useRef(null);
	const activeP2PRef      = useRef(activeP2P);
	// Ref so socket handler always calls the latest onUnreadUpdate without
	// needing it as an effect dependency (avoids listener re-registration).
	const onUnreadUpdateRef = useRef(onUnreadUpdate);

	useEffect(() => { activeP2PRef.current      = activeP2P;      }, [activeP2P]);
	useEffect(() => { onUnreadUpdateRef.current = onUnreadUpdate; }, [onUnreadUpdate]);

	// Focus message search input when it opens.
	useEffect(() => {
		if (msgSearchOpen) msgSearchInputRef.current?.focus();
	}, [msgSearchOpen]);

	// Load recent chats from localStorage once on mount.
	useEffect(() => {
		const stored = localStorage.getItem('mizuka_recent_p2p_chats');
		if (!stored) return;
		try { setRecentChats(JSON.parse(stored)); }
		catch { setRecentChats([]); }
	}, []);

	// Fetch per-room unread counts on mount / user change.
	useEffect(() => {
		if (!currentUser?.id) return;
		fetchUnreadCounts(currentUser.id).then((counts) => {
			const map = {};
			counts.forEach((r) => { map[r.chatroom_id] = Number(r.unread_count); });
			setRoomUnread(map);
		});
	}, [currentUser?.id]);

	// When the active P2P room changes, clear its badge and mark as read in DB.
	useEffect(() => {
		if (!activeP2P?.roomId || !currentUser?.id) return;
		markRoomAsRead(activeP2P.roomId, currentUser.id).then(() => {
			onUnreadUpdateRef.current?.();
		});
		setRoomUnread((prev) => {
			if (!prev[activeP2P.roomId]) return prev;
			const next = { ...prev };
			delete next[activeP2P.roomId];
			return next;
		});
	}, [activeP2P?.roomId, currentUser?.id]);

	// Increment per-room badge on incoming messages, or mark as read immediately
	// if the message arrived in the room the user currently has open.
	useEffect(() => {
		const handleMessage = (msg) => {
			if (String(msg.sender_id) === String(currentUser.id)) return;
			if (activeP2PRef.current?.roomId === msg.chatroom_id) {
				markRoomAsRead(msg.chatroom_id, currentUser.id).then(() => {
					onUnreadUpdateRef.current?.();
				});
				return;
			}
			setRoomUnread((prev) => ({
				...prev,
				[msg.chatroom_id]: (prev[msg.chatroom_id] || 0) + 1,
			}));
		};
		socket.on('receive_p2p_message', handleMessage);
		return () => socket.off('receive_p2p_message', handleMessage);
		// Only user.id needed — activeP2P and onUnreadUpdate are read via refs.
	}, [currentUser.id]);

	// Clean up both debounce timers on unmount.
	useEffect(() => {
		return () => {
			clearTimeout(debounceTimer.current);
			clearTimeout(msgDebounceTimer.current);
		};
	}, []);

	// ── Member search ───────────────────────────────────────────────────────

	const handleSearch = useCallback((val) => {
		setSearchTerm(val);
		clearTimeout(debounceTimer.current);
		if (val.length < 2) { setResults([]); return; }
		setLoading(true);
		debounceTimer.current = setTimeout(async () => {
			try {
				const users = await searchInstituteMembers(activeInstitute.id, val, currentUser.id);
				setResults(users || []);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);
	}, [activeInstitute.id, currentUser.id]);

	const handleStartChat = useCallback(async (user) => {
		if (startingChat === user.id) return;
		setStartingChat(user.id);
		try {
			const res = await getOrCreateP2PRoom(currentUser.id, user.id);
			if (res.error || !res.chatroom) return;

			const newRecent = [
				{
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					roomId: res.chatroom.id,
					lastChat: new Date().toISOString(),
				},
				...recentChats.filter((chat) => chat.id !== user.id),
			].slice(0, 10);

			setRecentChats(newRecent);
			localStorage.setItem('mizuka_recent_p2p_chats', JSON.stringify(newRecent));
			onStartP2P?.({ roomId: res.chatroom.id, otherUserId: user.id, otherUsername: user.username });
			setSearchTerm('');
			setResults([]);
		} catch {
			// silent
		} finally {
			setStartingChat(null);
		}
	}, [currentUser.id, recentChats, onStartP2P, startingChat]);

	const handleClearSearch = useCallback(() => {
		setSearchTerm('');
		setResults([]);
	}, []);

	// ── P2P message search ──────────────────────────────────────────────────

	const handleMsgSearchInput = useCallback((val) => {
		setMsgSearchTerm(val);
		clearTimeout(msgDebounceTimer.current);

		if (!val.trim() || val.length < 2) { setMsgSearchResults([]); return; }
		if (!recentChats.length) { setMsgSearchResults([]); return; }

		setMsgSearchLoading(true);
		msgDebounceTimer.current = setTimeout(async () => {
			try {
				// Search all recent chat rooms in parallel — same pattern as channel search.
				const settled = await Promise.allSettled(
					recentChats.map((chat) => searchP2PMessages(chat.roomId, val))
				);
				const merged = settled.flatMap((r, i) => {
					if (r.status !== 'fulfilled') return [];
					// Tag each result with chat metadata needed for navigation.
					return (r.value || []).map((msg) => ({
						...msg,
						roomId:        recentChats[i].roomId,
						otherUserId:   recentChats[i].id,
						otherUsername: recentChats[i].username,
					}));
				});
				merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				setMsgSearchResults(merged);
			} catch {
				setMsgSearchResults([]);
			} finally {
				setMsgSearchLoading(false);
			}
		}, 300);
	}, [recentChats]);

	const handleMsgResultClick = useCallback((result) => {
		onJumpToP2PMessage?.(result.roomId, result.id, result.otherUserId, result.otherUsername);
		setMsgSearchOpen(false);
		setMsgSearchTerm('');
		setMsgSearchResults([]);
	}, [onJumpToP2PMessage]);

	const handleCloseMsgSearch = useCallback(() => {
		setMsgSearchOpen(false);
		setMsgSearchTerm('');
		setMsgSearchResults([]);
	}, []);

	// ── Helpers ─────────────────────────────────────────────────────────────

	const isOnline  = useCallback((userId) => onlineUsers.has(String(userId)), [onlineUsers]);
	const getUnread = useCallback((roomId) => roomUnread[roomId] || 0, [roomUnread]);

	return (
		<div className='inbox-container'>
			<div className='inbox-header'>
				<h3 className='inbox-title'>Direct Messages</h3>
				{/* Search icon only shown when there are recent chats to search through */}
				{recentChats.length > 0 && (
					<button
						className={`inbox-msg-search-btn${msgSearchOpen ? ' active' : ''}`}
						onClick={() => setMsgSearchOpen((v) => !v)}
						aria-label='Search messages'
						aria-expanded={msgSearchOpen}
						title='Search messages'
					>
						<MessagesSquare size={14} strokeWidth={2} />
					</button>
				)}
			</div>

			{/* ── P2P message search panel ── */}
			{msgSearchOpen && (
				<div className='inbox-msg-search-wrap'>
					<div className='inbox-msg-search-row'>
						<Search size={13} className='inbox-msg-search-icon' />
						<input
							ref={msgSearchInputRef}
							type='text'
							className='inbox-msg-search-input'
							placeholder='Search conversations…'
							value={msgSearchTerm}
							onChange={(e) => handleMsgSearchInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Escape' && handleCloseMsgSearch()}
						/>
						{msgSearchTerm && (
							<button className='inbox-msg-search-clear' onClick={handleCloseMsgSearch} aria-label='Clear'>
								<X size={12} />
							</button>
						)}
					</div>

					{msgSearchLoading && (
						<div className='inbox-msg-search-status'>Searching…</div>
					)}

					{!msgSearchLoading && msgSearchTerm.length >= 2 && msgSearchResults.length === 0 && (
						<div className='inbox-msg-search-status'>No results found</div>
					)}

					{msgSearchResults.length > 0 && (
						<ul className='inbox-msg-search-results'>
							{msgSearchResults.map((result) => (
								<li key={`${result.roomId}-${result.id}`}>
									<button
										className='inbox-msg-search-result'
										onClick={() => handleMsgResultClick(result)}
										title={result.content}
									>
										<span className='inbox-msg-result-user'>
											<span className='inbox-msg-result-avatar'>
												{result.otherUsername?.[0]?.toUpperCase() || 'U'}
											</span>
											{result.otherUsername}
										</span>
										<span className='inbox-msg-result-content'>
											{result.content?.length > 80
												? result.content.slice(0, 80) + '…'
												: result.content}
										</span>
										{result.username && (
											<span className='inbox-msg-result-meta'>
												{result.username === currentUser.username ? 'You' : result.username}
											</span>
										)}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{/* ── Member search input ── */}
			<div className='inbox-search'>
				<Search size={16} className='inbox-search-icon' />
				<input
					type='text'
					placeholder='Search members...'
					value={searchTerm}
					onChange={(e) => handleSearch(e.target.value)}
					className='inbox-search-input'
				/>
				{searchTerm && (
					<button className='inbox-search-clear' onClick={handleClearSearch} aria-label='Clear search'>
						<X size={14} />
					</button>
				)}
			</div>

			{searchTerm ? (
				<div className='inbox-results'>
					{loading ? (
						<div className='inbox-loading'><span>Searching...</span></div>
					) : results.length > 0 ? (
						<div className='inbox-user-list'>
							{results.map((user) => (
								<button
									key={user.id}
									className='inbox-user-item'
									onClick={() => handleStartChat(user)}
									disabled={startingChat === user.id}
									title={`Message ${user.username}`}
								>
									<div className='inbox-user-avatar-wrap'>
										<div className='inbox-user-avatar'>{user.username?.[0]?.toUpperCase() || 'U'}</div>
										{isOnline(user.id) && <span className='inbox-online-dot' />}
									</div>
									<div className='inbox-user-info'>
										<div className='inbox-user-name'>{user.username}</div>
										<div className='inbox-user-role'>{user.role}</div>
									</div>
									<MessageCircle size={16} className='inbox-user-action' />
								</button>
							))}
						</div>
					) : (
						<div className='inbox-empty'><span>No members found</span></div>
					)}
				</div>
			) : (
				<div className='inbox-recent'>
					{recentChats.length > 0 ? (
						<>
							<div className='inbox-recent-header'>Recent</div>
							<div className='inbox-user-list'>
								{recentChats.map((chat) => {
									const unread = getUnread(chat.roomId);
									return (
										<button
											key={chat.id}
											className={`inbox-user-item${unread > 0 ? ' has-unread' : ''}`}
											onClick={() => handleStartChat({ id: chat.id, username: chat.username, email: chat.email, role: chat.role })}
											disabled={startingChat === chat.id}
											title={`Message ${chat.username}`}
										>
											<div className='inbox-user-avatar-wrap'>
												<div className='inbox-user-avatar'>{chat.username?.[0]?.toUpperCase() || 'U'}</div>
												{isOnline(chat.id) && <span className='inbox-online-dot' />}
											</div>
											<div className='inbox-user-info'>
												<div className='inbox-user-name'>{chat.username}</div>
												<div className='inbox-user-role'>{chat.role}</div>
											</div>
											{unread > 0 ? (
												<span className='inbox-unread-badge'>{unread > 99 ? '99+' : unread}</span>
											) : (
												<MessageCircle size={16} className='inbox-user-action' />
											)}
										</button>
									);
								})}
							</div>
						</>
					) : (
						<div className='inbox-empty'><span>No recent chats. Search to start one!</span></div>
					)}
				</div>
			)}
		</div>
	);
}

export default Inbox;