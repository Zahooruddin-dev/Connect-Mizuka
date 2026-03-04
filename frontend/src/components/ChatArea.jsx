import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';
import { fetchMessages } from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import './styles/ChatArea.css';

function ChatArea({ channelId, channelLabel, instituteId, user, onChannelRenamed }) {
	const [messages, setMessages] = useState([]);
	const [typingUsers, setTypingUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentLabel, setCurrentLabel] = useState(channelLabel);

	const activeChannelRef = useRef(channelId);

	useEffect(() => {
		setCurrentLabel(channelLabel);
	}, [channelLabel]);

	useEffect(() => {
		activeChannelRef.current = channelId;

		setLoading(true);
		setMessages([]);
		setTypingUsers([]);

		const joinRoom = () => socket.emit('join_institute', channelId);

		if (socket.connected) {
			joinRoom();
		} else {
			socket.once('connect', joinRoom);
		}

		fetchMessages(channelId)
			.then((res) => {
				if (activeChannelRef.current !== channelId) return;
				const data = Array.isArray(res.data) ? res.data : res.data.messages || [];
				setMessages(data);
			})
			.catch(() => {
				if (activeChannelRef.current === channelId) setMessages([]);
			})
			.finally(() => {
				if (activeChannelRef.current === channelId) setLoading(false);
			});

		const handleReceive = (msg) => {
			if (msg.channel_id && msg.channel_id !== channelId) return;
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
			if (channel_id && channel_id !== channelId) return;
			setTypingUsers((prev) => prev.includes(username) ? prev : [...prev, username]);
		};

		const handleHideTyping = ({ channel_id } = {}) => {
			if (channel_id && channel_id !== channelId) return;
			setTypingUsers([]);
		};

		const handleSocketChannelDeleted = ({ channelId: deletedId }) => {
			if (deletedId === channelId) {
				setMessages([])
			}
		};

		const handleSocketChannelRenamed = ({ channel }) => {
			if (channel.id === channelId) {
				setCurrentLabel(channel.name)
				if (typeof onChannelRenamed === 'function') onChannelRenamed(channel)
			}
		};

		socket.on('receive_message', handleReceive);
		socket.on('Display_typing', handleDisplayTyping);
		socket.on('hide_typing', handleHideTyping);
		socket.on('channel_deleted', handleSocketChannelDeleted);
		socket.on('channel_renamed', handleSocketChannelRenamed);

		return () => {
			socket.emit('leave_institute', channelId);
			socket.off('receive_message', handleReceive);
			socket.off('Display_typing', handleDisplayTyping);
			socket.off('hide_typing', handleHideTyping);
			socket.off('connect', joinRoom);
			socket.off('channel_deleted', handleSocketChannelDeleted);
			socket.off('channel_renamed', handleSocketChannelRenamed);
		};
	}, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

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

	const handleTyping = useCallback(() => {
		socket.emit('typing', { channel_id: channelId, username: user.username });
	}, [channelId, user]);

	const handleStopTyping = useCallback(() => {
		socket.emit('stop_typing', { channel_id: channelId, username: user.username });
	}, [channelId, user]);

	const handleMessageDeleted = useCallback((id) => {
		setMessages((prev) => prev.filter((m) => (m.id || m._id) !== id));
	}, []);

	const handleChannelDeleted = useCallback(() => {
		setMessages([]);
	}, []);

	const handleChannelRenamed = useCallback((updatedChannel) => {
		setCurrentLabel(updatedChannel.name);
		if (typeof onChannelRenamed === 'function') onChannelRenamed(updatedChannel);
	}, [onChannelRenamed]);

	return (
		<div className='chat-area'>
			<ChatHeader
				channelId={channelId}
				channelLabel={currentLabel}
				instituteId={instituteId}
				onChannelDeleted={handleChannelDeleted}
				onChannelRenamed={handleChannelRenamed}
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