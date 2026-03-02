import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';
import { fetchMessages } from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import './styles/ChatArea.css';

function ChatArea({ channelId, channelLabel, user }) {
	const [messages, setMessages] = useState([]);
	const [typingUsers, setTypingUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	// Track which channel the current socket listeners are bound to
	// so we can ignore stale events that arrive after a channel switch
	const activeChannelRef = useRef(channelId);

	useEffect(() => {
		activeChannelRef.current = channelId;

		setLoading(true);
		setMessages([]);
		setTypingUsers([]);

		// ── JOIN new room ──────────────────────────────────────────
		const joinRoom = () => socket.emit('join_institute', channelId);

		if (socket.connected) {
			joinRoom();
		} else {
			socket.once('connect', joinRoom);
		}

		// ── FETCH history ──────────────────────────────────────────
		fetchMessages(channelId)
			.then((res) => {
				// Only apply if we're still on this channel
				if (activeChannelRef.current !== channelId) return;
				const data = Array.isArray(res.data)
					? res.data
					: res.data.messages || [];
				setMessages(data);
			})
			.catch(() => {
				if (activeChannelRef.current === channelId) setMessages([]);
			})
			.finally(() => {
				if (activeChannelRef.current === channelId) setLoading(false);
			});

		// ── SOCKET HANDLERS ────────────────────────────────────────
		const handleReceive = (msg) => {
			// Drop events that don't belong to the currently-viewed channel
			if (msg.channel_id && msg.channel_id !== channelId) return;

			// Drop our own messages — we already add them optimistically
			if (msg.from === user.id || msg.sender_id === user.id) return;

			const normalised = {
				id: msg.id,
				content: msg.text ?? msg.content,
				sender_id: msg.from ?? msg.sender_id,
				username: msg.username,
				created_at: msg.timestamp ?? msg.created_at,
			};

			setMessages((prev) => {
				if (prev.some((m) => m.id === normalised.id)) return prev;
				return [...prev, normalised];
			});
		};

		const handleDisplayTyping = ({ username, channel_id }) => {
			// Only show typing for the active channel
			if (channel_id && channel_id !== channelId) return;
			setTypingUsers((prev) =>
				prev.includes(username) ? prev : [...prev, username],
			);
		};

		const handleHideTyping = ({ channel_id } = {}) => {
			// Only clear typing for the active channel
			if (channel_id && channel_id !== channelId) return;
			setTypingUsers([]);
		};

		socket.on('receive_message', handleReceive);
		socket.on('Display_typing', handleDisplayTyping);
		socket.on('hide_typing', handleHideTyping);

		// ── CLEANUP: leave room + remove listeners ─────────────────
		return () => {
			socket.emit('leave_institute', channelId); // leave the old room
			socket.off('receive_message', handleReceive);
			socket.off('Display_typing', handleDisplayTyping);
			socket.off('hide_typing', handleHideTyping);
			socket.off('connect', joinRoom); // prevent stale once-listener
		};
	}, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

	// ── SEND (optimistic) ──────────────────────────────────────────
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

			socket.emit('send_message', {
				channel_id: channelId,
				message: content,
				sender_id: user.id,
				username: user.username,
			});
		},
		[channelId, user],
	);

	// ── TYPING ─────────────────────────────────────────────────────
	const handleTyping = useCallback(() => {
		socket.emit('typing', {
			channel_id: channelId,
			username: user.username,
		});
	}, [channelId, user]);

	const handleStopTyping = useCallback(() => {
		socket.emit('stop_typing', {
			channel_id: channelId,
			username: user.username,
		});
	}, [channelId, user]);

	// ── LOCAL DELETES ──────────────────────────────────────────────
	const handleMessageDeleted = useCallback((id) => {
		setMessages((prev) => prev.filter((m) => (m.id || m._id) !== id));
	}, []);

	const handleChannelDeleted = useCallback(() => {
		setMessages([]);
	}, []);

	return (
		<div className='chat-area'>
			<ChatHeader
				channelId={channelId}
				channelLabel={channelLabel}
				onChannelDeleted={handleChannelDeleted}
			/>
			{loading ? (
				<div className='chat-loading'>
					<div className='chat-loading-dots'>
						<span />
						<span />
						<span />
					</div>
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

export default ChatArea;