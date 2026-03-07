import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MessageCircle } from 'lucide-react';
import { searchInstituteMembers } from '../services/api';
import { getOrCreateP2PRoom, fetchUnreadCounts } from '../services/p2p-api';
import socket from '../services/socket';
import './styles/Inbox.css';

function Inbox({ activeInstitute, currentUser, onStartP2P, onlineUsers = new Set(), activeP2P }) {
	const [searchTerm, setSearchTerm] = useState('');
	const [results, setResults] = useState([]);
	const [recentChats, setRecentChats] = useState([]);
	const [loading, setLoading] = useState(false);
	const [startingChat, setStartingChat] = useState(null);
	const [roomUnread, setRoomUnread] = useState({});

	const debounceTimer = useRef(null);
	const activeP2PRef = useRef(activeP2P);

	useEffect(() => {
		activeP2PRef.current = activeP2P;
	}, [activeP2P]);

	useEffect(() => {
		const stored = localStorage.getItem('mizuka_recent_p2p_chats');
		if (stored) {
			try {
				setRecentChats(JSON.parse(stored));
			} catch {
				setRecentChats([]);
			}
		}
	}, []);

	useEffect(() => {
		if (!currentUser?.id) return;
		fetchUnreadCounts(currentUser.id).then((counts) => {
			const map = {};
			counts.forEach((r) => {
				map[r.chatroom_id] = Number(r.unread_count);
			});
			setRoomUnread(map);
		});
	}, [currentUser?.id]);

	useEffect(() => {
		if (!activeP2P?.roomId || !currentUser?.id) return;

		socket.emit('mark_as_read', {
			chatroom_id: activeP2P.roomId,
			reader_id: currentUser.id,
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
			const currentRoom = activeP2PRef.current?.roomId;

			if (String(msg.sender_id) === String(currentUser.id)) return;

			if (currentRoom === msg.chatroom_id) {
				socket.emit('mark_as_read', {
					chatroom_id: msg.chatroom_id,
					reader_id: currentUser.id,
				});
				return;
			}

			setRoomUnread((prev) => ({
				...prev,
				[msg.chatroom_id]: (prev[msg.chatroom_id] || 0) + 1,
			}));
		};

		const handleRead = ({ chatroom_id, reader_id }) => {
			if (String(reader_id) !== String(currentUser.id)) return;
			setRoomUnread((prev) => {
				const next = { ...prev };
				delete next[chatroom_id];
				return next;
			});
		};

		socket.on('receive_p2p_message', handleMessage);
		socket.on('messages_read', handleRead);
		return () => {
			socket.off('receive_p2p_message', handleMessage);
			socket.off('messages_read', handleRead);
		};
	}, [currentUser.id]);

	const handleSearch = useCallback(
		(val) => {
			setSearchTerm(val);
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
			if (val.length < 2) {
				setResults([]);
				return;
			}
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

	const handleStartChat = async (user) => {
		if (startingChat === user.id) return;
		setStartingChat(user.id);

		try {
			const res = await getOrCreateP2PRoom(currentUser.id, user.id);

			if (res.error) {
				setStartingChat(null);
				return;
			}

			if (res.chatroom && typeof onStartP2P === 'function') {
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

				onStartP2P({
					roomId: res.chatroom.id,
					otherUserId: user.id,
					otherUsername: user.username,
				});

				setSearchTerm('');
				setResults([]);
			}
		} catch {
			// silent
		} finally {
			setStartingChat(null);
		}
	};

	const handleClearSearch = () => {
		setSearchTerm('');
		setResults([]);
	};

	const isOnline = (userId) => onlineUsers.has(String(userId));
	const getUnread = (roomId) => roomUnread[roomId] || 0;

	return (
		<div className='inbox-container'>
			<div className='inbox-header'>
				<h3 className='inbox-title'>Direct Messages</h3>
			</div>

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
						<div className='inbox-loading'>
							<span>Searching...</span>
						</div>
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
						<div className='inbox-empty'>
							<span>No members found</span>
						</div>
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
											onClick={() =>
												handleStartChat({
													id: chat.id,
													username: chat.username,
													email: chat.email,
													role: chat.role,
												})
											}
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
												<div className='inbox-user-role'>{chat.role}</div>
											</div>
											{unread > 0 ? (
												<span className='inbox-unread-badge'>
													{unread > 99 ? '99+' : unread}
												</span>
											) : (
												<MessageCircle size={16} className='inbox-user-action' />
											)}
										</button>
									);
								})}
							</div>
						</>
					) : (
						<div className='inbox-empty'>
							<span>No recent chats. Search to start one!</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default Inbox;