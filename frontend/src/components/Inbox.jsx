import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MessageCircle } from 'lucide-react';
import { searchInstituteMembers, getOrCreateP2PRoom } from '../services/api';
import './styles/Inbox.css';

function Inbox({ activeInstitute, currentUser, onStartP2P }) {
	const [searchTerm, setSearchTerm] = useState('');
	const [results, setResults] = useState([]);
	const [recentChats, setRecentChats] = useState([]);
	const [loading, setLoading] = useState(false);
	const [startingChat, setStartingChat] = useState(null);

	const debounceTimer = useRef(null);

	useEffect(() => {
		// Load recent chats from localStorage
		const stored = localStorage.getItem('mizuka_recent_p2p_chats');
		if (stored) {
			try {
				setRecentChats(JSON.parse(stored));
			} catch {
				setRecentChats([]);
			}
		}
	}, []);

	const handleSearch = useCallback(
		(val) => {
			setSearchTerm(val);

			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}

			if (val.length < 2) {
				setResults([]);
				return;
			}

			setLoading(true);

			debounceTimer.current = setTimeout(async () => {
				try {
					console.log('[Inbox] Searching for:', val);
					const users = await searchInstituteMembers(
						activeInstitute.id,
						val,
						currentUser.id,
					);
					console.log('[Inbox] Search results:', users);
					setResults(users || []);
				} catch (error) {
					console.error('[Inbox] Search error:', error);
					setResults([]);
				} finally {
					setLoading(false);
				}
			}, 300); // 300ms debounce
		},
		[activeInstitute.id, currentUser.id],
	);

	const handleStartChat = async (user) => {
		if (startingChat === user.id) return;

		console.log('[Inbox] Starting chat with:', user.username);
		setStartingChat(user.id);

		try {
			const res = await getOrCreateP2PRoom(currentUser.id, user.id);

			if (res.error) {
				console.error('[Inbox] Failed to create room:', res.error);
				setStartingChat(null);
				return;
			}

			if (res.chatroom && typeof onStartP2P === 'function') {
				// Add to recent chats
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
				].slice(0, 10); // Keep last 10

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
		} catch (error) {
			console.error('[Inbox] Chat start error:', error);
		} finally {
			setStartingChat(null);
		}
	};

	const handleClearSearch = () => {
		setSearchTerm('');
		setResults([]);
	};

	return (
		<div className="inbox-container">
			<div className="inbox-header">
				<h3 className="inbox-title">Direct Messages</h3>
			</div>

			<div className="inbox-search">
				<Search size={16} className="inbox-search-icon" />
				<input
					type="text"
					placeholder="Search members..."
					value={searchTerm}
					onChange={(e) => handleSearch(e.target.value)}
					className="inbox-search-input"
				/>
				{searchTerm && (
					<button
						className="inbox-search-clear"
						onClick={handleClearSearch}
						aria-label="Clear search"
					>
						<X size={14} />
					</button>
				)}
			</div>

			{searchTerm ? (
				<div className="inbox-results">
					{loading ? (
						<div className="inbox-loading">
							<span>Searching...</span>
						</div>
					) : results.length > 0 ? (
						<div className="inbox-user-list">
							{results.map((user) => (
								<button
									key={user.id}
									className="inbox-user-item"
									onClick={() => handleStartChat(user)}
									disabled={startingChat === user.id}
									title={`Message ${user.username}`}
								>
									<div className="inbox-user-avatar">
										{user.username?.[0]?.toUpperCase() || 'U'}
									</div>
									<div className="inbox-user-info">
										<div className="inbox-user-name">{user.username}</div>
										<div className="inbox-user-role">{user.role}</div>
									</div>
									<MessageCircle size={16} className="inbox-user-action" />
								</button>
							))}
						</div>
					) : (
						<div className="inbox-empty">
							<span>No members found</span>
						</div>
					)}
				</div>
			) : (
				<div className="inbox-recent">
					{recentChats.length > 0 ? (
						<>
							<div className="inbox-recent-header">Recent</div>
							<div className="inbox-user-list">
								{recentChats.map((chat) => (
									<button
										key={chat.id}
										className="inbox-user-item"
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
										<div className="inbox-user-avatar">
											{chat.username?.[0]?.toUpperCase() || 'U'}
										</div>
										<div className="inbox-user-info">
											<div className="inbox-user-name">{chat.username}</div>
											<div className="inbox-user-role">{chat.role}</div>
										</div>
										<MessageCircle size={16} className="inbox-user-action" />
									</button>
								))}
							</div>
						</>
					) : (
						<div className="inbox-empty">
							<span>No recent chats. Search to start one!</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default Inbox;