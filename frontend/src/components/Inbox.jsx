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

const STORAGE_KEY = 'mizuka_recent_p2p_chats';

function loadStoredChats() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveChats(chats) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function upsertChat(prev, entry) {
	const exists = prev.findIndex((c) => c.roomId === entry.roomId);
	const next = exists !== -1
		? prev.map((c, i) => i === exists ? { ...c, ...entry } : c)
		: [entry, ...prev].slice(0, 20);
	return next.sort((a, b) => {
		const ta = a.lastMessage?.created_at ?? a.lastChat ?? 0;
		const tb = b.lastMessage?.created_at ?? b.lastChat ?? 0;
		return new Date(tb) - new Date(ta);
	});
}

function Inbox({
	activeInstitute,
	currentUser,
	onStartP2P,
	onlineUsers = new Set(),
	activeP2P,
	onUnreadUpdate,
	onJumpToP2PMessage,
}) {
	const [searchTerm, setSearchTerm] = useState('');
	const [results, setResults] = useState([]);
	const [recentChats, setRecentChats] = useState(loadStoredChats);
	const [loading, setLoading] = useState(false);
	const [startingChat, setStartingChat] = useState(null);
	const [roomUnread, setRoomUnread] = useState({});

	const [msgSearchOpen, setMsgSearchOpen] = useState(false);
	const [msgSearchTerm, setMsgSearchTerm] = useState('');
	const [msgSearchResults, setMsgSearchResults] = useState([]);
	const [msgSearchLoading, setMsgSearchLoading] = useState(false);

	const debounceTimer = useRef(null);
	const msgDebounceTimer = useRef(null);
	const msgSearchInputRef = useRef(null);
	const activeP2PRef = useRef(activeP2P);
	const onUnreadUpdateRef = useRef(onUnreadUpdate);
	const currentUserRef = useRef(currentUser);

	useEffect(() => { activeP2PRef.current = activeP2P; }, [activeP2P]);
	useEffect(() => { onUnreadUpdateRef.current = onUnreadUpdate; }, [onUnreadUpdate]);
	useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

	useEffect(() => {
		if (msgSearchOpen) msgSearchInputRef.current?.focus();
	}, [msgSearchOpen]);

	useEffect(() => {
		if (!currentUser?.id) return;
		fetchUnreadCounts(currentUser.id).then((counts) => {
			const map = {};
			counts.forEach((r) => { map[r.chatroom_id] = Number(r.unread_count); });
			setRoomUnread(map);
		});
	}, [currentUser?.id]);

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

	useEffect(() => {
		const handleMessage = (msg) => {
			const me = currentUserRef.current;
			const fromMe = String(msg.sender_id) === String(me?.id);

			setRecentChats((prev) => {
				const existing = prev.find((c) => c.roomId === msg.chatroom_id);

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
							id: fromMe ? null : msg.sender_id,
							username: fromMe ? null : msg.username,
							roomId: msg.chatroom_id,
							lastChat: msg.created_at,
							lastMessage: {
								content: msg.content,
								created_at: msg.created_at,
								fromMe,
							},
					  };

				if (!existing && fromMe) return prev;

				const next = upsertChat(prev, entry);
				saveChats(next);
				return next;
			});

			if (fromMe) return;

			if (activeP2PRef.current?.roomId === msg.chatroom_id) {
				markRoomAsRead(msg.chatroom_id, me.id).then(() => {
					onUnreadUpdateRef.current?.();
				});
				return;
			}

			setRoomUnread((prev) => ({
				...prev,
				[msg.chatroom_id]: (prev[msg.chatroom_id] || 0) + 1,
			}));
			onUnreadUpdateRef.current?.();
		};

		socket.on('receive_p2p_message', handleMessage);
		return () => socket.off('receive_p2p_message', handleMessage);
	}, []);

	useEffect(() => {
		return () => {
			clearTimeout(debounceTimer.current);
			clearTimeout(msgDebounceTimer.current);
		};
	}, []);

	const handleSearch = useCallback(
		(val) => {
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
		},
		[activeInstitute.id, currentUser.id],
	);

	const handleStartChat = useCallback(
		async (user) => {
			if (startingChat === user.id) return;
			setStartingChat(user.id);
			try {
				const res = await getOrCreateP2PRoom(user.id);
				if (res.error || !res.chatroom) return;

				const entry = {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					roomId: res.chatroom.id,
					lastChat: new Date().toISOString(),
				};

				setRecentChats((prev) => {
					const next = upsertChat(prev, entry);
					saveChats(next);
					return next;
				});

				onStartP2P?.({ roomId: res.chatroom.id, otherUserId: user.id, otherUsername: user.username });
				setSearchTerm('');
				setResults([]);
			} catch {
			} finally {
				setStartingChat(null);
			}
		},
		[recentChats, onStartP2P, startingChat],
	);

	const handleClearSearch = useCallback(() => {
		setSearchTerm('');
		setResults([]);
	}, []);

	const handleMsgSearchInput = useCallback(
		(val) => {
			setMsgSearchTerm(val);
			clearTimeout(msgDebounceTimer.current);
			if (!val.trim() || val.length < 2) { setMsgSearchResults([]); return; }
			if (!recentChats.length) { setMsgSearchResults([]); return; }
			setMsgSearchLoading(true);
			msgDebounceTimer.current = setTimeout(async () => {
				try {
					const settled = await Promise.allSettled(
						recentChats.map((chat) => searchP2PMessages(chat.roomId, val)),
					);
					const merged = settled.flatMap((r, i) => {
						if (r.status !== 'fulfilled') return [];
						return (r.value || []).map((msg) => ({
							...msg,
							roomId: recentChats[i].roomId,
							otherUserId: recentChats[i].id,
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
		},
		[recentChats],
	);

	const handleMsgResultClick = useCallback(
		(result) => {
			onJumpToP2PMessage?.(result.roomId, result.id, result.otherUserId, result.otherUsername);
			setMsgSearchOpen(false);
			setMsgSearchTerm('');
			setMsgSearchResults([]);
		},
		[onJumpToP2PMessage],
	);

	const handleCloseMsgSearch = useCallback(() => {
		setMsgSearchOpen(false);
		setMsgSearchTerm('');
		setMsgSearchResults([]);
	}, []);

	const isOnline = useCallback((userId) => onlineUsers.has(String(userId)), [onlineUsers]);
	const getUnread = useCallback((roomId) => roomUnread[roomId] || 0, [roomUnread]);

	return (
		<div className='inbox-container'>
			<div className='inbox-header'>
				<h3 className='inbox-title'>Direct Messages</h3>
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

					{msgSearchLoading && <div className='inbox-msg-search-status'>Searching…</div>}

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
											{result.content?.length > 80 ? result.content.slice(0, 80) + '…' : result.content}
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
										<div className='inbox-user-avatar'>
											{user.username?.[0]?.toUpperCase() || 'U'}
										</div>
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
									const lastMsg = chat.lastMessage;
									return (
										<button
											key={chat.roomId}
											className={`inbox-user-item${unread > 0 ? ' has-unread' : ''}`}
											onClick={() => handleStartChat({ id: chat.id, username: chat.username, email: chat.email, role: chat.role })}
											disabled={startingChat === chat.id}
											title={`Message ${chat.username}`}
										>
											<div className='inbox-user-avatar-wrap'>
												<div className='inbox-user-avatar'>
													{chat.username?.[0]?.toUpperCase() || 'U'}
												</div>
												{isOnline(chat.id) && <span className='inbox-online-dot' />}
											</div>
											<div className='inbox-user-info'>
												<div className='inbox-user-name'>{chat.username}</div>
												{lastMsg ? (
													<div className={`inbox-last-message${unread > 0 ? ' inbox-last-message--unread' : ''}`}>
														{lastMsg.fromMe && <span className='inbox-last-message-you'>You: </span>}
														{lastMsg.content?.length > 40 ? lastMsg.content.slice(0, 40) + '…' : lastMsg.content}
													</div>
												) : (
													<div className='inbox-user-role'>{chat.role}</div>
												)}
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