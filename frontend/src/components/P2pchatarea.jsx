import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import socket from '../services/socket';
import { fetchP2PMessages } from '../services/p2p-api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './styles/P2pchatarea.css';

const messageCache = new Map();

function P2PChatArea({ roomId, otherUsername, otherUserId, user, onClose }) {
	const cached = messageCache.get(roomId);

	const [messages, setMessages] = useState(cached || []);
	const [typingUsers, setTypingUsers] = useState([]);
	const [loading, setLoading] = useState(!cached);
	const [error, setError] = useState(null);
	const [retryCount, setRetryCount] = useState(0);

	const activeRoomRef = useRef(roomId);
	// Keeping a ref to the latest messages so the changed check below can read
	// current state without stale closures.
	const messagesRef = useRef(messages);
	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	// Write-through helper, updates both React state and the module cache
	const setAndCacheMessages = useCallback((updater) => {
		setMessages((prev) => {
			const next = typeof updater === 'function' ? updater(prev) : updater;
			messageCache.set(roomId, next);
			return next;
		});
	}, [roomId]);

	useEffect(() => {
		activeRoomRef.current = roomId;

		// Restore from cache immediately so the user sees something at start.
		const hit = messageCache.get(roomId);
		if (hit) {
			setMessages(hit);
			setLoading(false);
		} else {
			setMessages([]);
			setLoading(true);
		}

		setError(null);
		setTypingUsers([]);

		const joinRoom = () => socket.emit('join_p2p', roomId);
		if (socket.connected) {
			joinRoom();
		} else {
			socket.once('connect', joinRoom);
		}

		fetchP2PMessages(roomId, user.id)
			.then((res) => {
				if (activeRoomRef.current !== roomId) return;
				const fresh = Array.isArray(res.data) ? res.data : res.data.messages || [];
				const current = messagesRef.current;
				const changed =
					fresh.length !== current.length ||
					fresh.some((m, i) => m.id !== current[i]?.id);

				if (changed) {
					setAndCacheMessages(fresh);
				}
			})
			.catch(() => {
				if (activeRoomRef.current !== roomId) return;
				if (!messageCache.get(roomId)?.length) {
					setError('Failed to load messages');
				}
			})
			.finally(() => {
				if (activeRoomRef.current === roomId) setLoading(false);
			});

		const handleReceive = (msg) => {
			if (msg.chatroom_id && msg.chatroom_id !== roomId) return;

			if (msg.sender_id === user.id) {
				setAndCacheMessages((prev) => {
					const tempIndex = prev.findIndex(
						(m) =>
							String(m.id).startsWith('temp-') &&
							m.content === msg.content &&
							m.sender_id === user.id,
					);
					if (tempIndex === -1) return prev;
					const next = [...prev];
					next[tempIndex] = {
						id: msg.id,
						content: msg.content,
						sender_id: msg.sender_id,
						username: msg.username,
						created_at: msg.created_at,
					};
					return next;
				});
				return;
			}

			const normalised = {
				id: msg.id,
				content: msg.content,
				sender_id: msg.sender_id,
				username: msg.username,
				created_at: msg.created_at,
			};

			setAndCacheMessages((prev) => {
				if (prev.some((m) => m.id === normalised.id)) return prev;
				return [...prev, normalised];
			});
		};

		const handleDisplayTyping = ({ username, room_id }) => {
			if (room_id && room_id !== roomId) return;
			setTypingUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
		};

		const handleHideTyping = ({ room_id } = {}) => {
			if (room_id && room_id !== roomId) return;
			setTypingUsers([]);
		};

		socket.on('receive_p2p_message', handleReceive);
		socket.on('Display_p2p_typing', handleDisplayTyping);
		socket.on('hide_p2p_typing', handleHideTyping);

		return () => {
			socket.emit('leave_p2p', roomId);
			socket.off('receive_p2p_message', handleReceive);
			socket.off('Display_p2p_typing', handleDisplayTyping);
			socket.off('hide_p2p_typing', handleHideTyping);
		};
	// retryCount is intentionally a dependency — incrementing it re-runs the
	// effect which re-triggers the fetch, acting as a simple retry mechanism.
	}, [roomId, user.id, retryCount]);

	const handleSend = useCallback(
		(content) => {
			const tempMessage = {
				id: `temp-${Date.now()}`,
				content,
				sender_id: user.id,
				username: user.username,
				created_at: new Date().toISOString(),
			};
			setAndCacheMessages((prev) => [...prev, tempMessage]);
			socket.emit('send_p2p_message', {
				chatroom_id: roomId,
				message: content,
				sender_id: user.id,
				username: user.username,
			});
		},
		[roomId, user, setAndCacheMessages],
	);

	const handleTyping = useCallback(() => {
		socket.emit('typing_p2p', { room_id: roomId, username: user.username });
	}, [roomId, user]);

	const handleStopTyping = useCallback(() => {
		socket.emit('stop_typing_p2p', { room_id: roomId, username: user.username });
	}, [roomId, user]);

	const handleMessageDeleted = useCallback((id) => {
		setAndCacheMessages((prev) => prev.filter((m) => (m.id || m._id) !== id));
	}, [setAndCacheMessages]);

	const handleRetry = useCallback(() => {
		setError(null);
		setLoading(true);
		setRetryCount((c) => c + 1);
	}, []);

	return (
		<div className='p2p-chat-area'>
			<div className='p2p-chat-header'>
				<div className='p2p-chat-title'>
					<span className='p2p-username'>{otherUsername}</span>
				</div>
				<button className='p2p-close-btn' onClick={onClose} aria-label='Close chat'>
					<X size={18} strokeWidth={2} />
				</button>
			</div>

			{loading ? (
				<div className='p2p-chat-loading'>
					<div className='chat-loading-dots'>
						<span />
						<span />
						<span />
					</div>
					<span>Loading conversation...</span>
				</div>
			) : error ? (
				<div className='p2p-chat-error'>
					<span>{error}</span>
					<button onClick={handleRetry}>Try again</button>
				</div>
			) : (
				<MessageList
					messages={messages}
					typingUsers={typingUsers.filter((u) => u !== user.username)}
					currentUserId={user.id}
					onMessageDeleted={handleMessageDeleted}
				/>
			)}

			<MessageInput
				onSend={handleSend}
				onTyping={handleTyping}
				onStopTyping={handleStopTyping}
			/>
		</div>
	);
}

export default P2PChatArea;