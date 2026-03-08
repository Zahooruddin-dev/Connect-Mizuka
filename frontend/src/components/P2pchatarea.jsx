import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import socket from '../services/socket';
import { fetchP2PMessages } from '../services/p2p-api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './styles/P2PChatArea.css';

function P2PChatArea({ roomId, otherUsername, otherUserId, user, onClose }) {
	const [messages, setMessages] = useState([]);
	const [typingUsers, setTypingUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const activeRoomRef = useRef(roomId);

	useEffect(() => {
		activeRoomRef.current = roomId;

		setLoading(true);
		setError(null);
		setMessages([]);
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
				const data = Array.isArray(res.data) ? res.data : res.data.messages || [];
				setMessages(data);
			})
			.catch(() => {
				if (activeRoomRef.current === roomId) {
					setError('Failed to load messages');
					setMessages([]);
				}
			})
			.finally(() => {
				if (activeRoomRef.current === roomId) setLoading(false);
			});

		const handleReceive = (msg) => {
			if (msg.chatroom_id && msg.chatroom_id !== roomId) return;
			if (msg.sender_id === user.id) return;

			const normalised = {
				id: msg.id,
				content: msg.content,
				sender_id: msg.sender_id,
				username: msg.username,
				created_at: msg.created_at,
			};

			setMessages((prev) => {
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
	}, [roomId, user.id]);

	const handleSend = useCallback(
		(content) => {
			const tempMessage = {
				id: `temp-${Date.now()}`,
				content,
				sender_id: user.id,
				username: user.username,
				created_at: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, tempMessage]);
			socket.emit('send_p2p_message', {
				chatroom_id: roomId,
				message: content,
				sender_id: user.id,
				username: user.username,
			});
		},
		[roomId, user],
	);

	const handleTyping = useCallback(() => {
		socket.emit('typing_p2p', { room_id: roomId, username: user.username });
	}, [roomId, user]);

	const handleStopTyping = useCallback(() => {
		socket.emit('stop_typing_p2p', { room_id: roomId, username: user.username });
	}, [roomId, user]);

	const handleMessageDeleted = useCallback((id) => {
		setMessages((prev) => prev.filter((m) => (m.id || m._id) !== id));
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
					<button onClick={() => window.location.reload()}>Reload</button>
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