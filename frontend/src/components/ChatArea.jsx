import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';
import {
	fetchMessages,
	fetchP2PMessages,
	deleteP2PMessage,
} from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import './styles/ChatArea.css';

function ChatArea({
	channelId,
	channelLabel,
	instituteId,
	roomId,
	otherUsername,
	user,
	onChannelRenamed,
	onStartP2P,
	onCloseP2P,
}) {
	const [messages, setMessages] = useState([]);
	const [typingUsers, setTypingUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentLabel, setCurrentLabel] = useState(
		channelLabel || otherUsername,
	);

	const activeChannelRef = useRef(channelId);
	const activeRoomRef = useRef(roomId);
	const isP2P = !!roomId;

	useEffect(() => {
		setCurrentLabel(channelLabel || otherUsername);
	}, [channelLabel, otherUsername]);

	useEffect(() => {
		activeChannelRef.current = channelId;
		activeRoomRef.current = roomId;

		setLoading(true);
		setMessages([]);
		setTypingUsers([]);

		// Determine which socket event to emit and which room to join
		const socketEvent = isP2P ? 'join_p2p' : 'join_institute';
		const roomToJoin = isP2P ? roomId : channelId;

		const joinRoom = () => {
			console.log(
				`[ChatArea] Joining ${isP2P ? 'P2P' : 'channel'} room:`,
				roomToJoin,
			);
			socket.emit(socketEvent, roomToJoin);
		};

		if (socket.connected) {
			joinRoom();
		} else {
			socket.once('connect', joinRoom);
		}

		// Fetch messages from appropriate endpoint
		const fetchFn = isP2P ? fetchP2PMessages : fetchMessages;
		fetchFn(roomToJoin)
			.then((res) => {
				const currentRoom = isP2P
					? activeRoomRef.current
					: activeChannelRef.current;
				if (currentRoom !== roomToJoin) return;

				const data = Array.isArray(res.data)
					? res.data
					: res.data.messages || [];
				setMessages(data);
			})
			.catch(() => {
				const currentRoom = isP2P
					? activeRoomRef.current
					: activeChannelRef.current;
				if (currentRoom === roomToJoin) setMessages([]);
			})
			.finally(() => {
				const currentRoom = isP2P
					? activeRoomRef.current
					: activeChannelRef.current;
				if (currentRoom === roomToJoin) setLoading(false);
			});

		// Message receive handler
		const handleReceive = (msg) => {
			const currentRoom = isP2P
				? activeRoomRef.current
				: activeChannelRef.current;

			// Filter by room/channel
			if (isP2P) {
				if (msg.chatroom_id && msg.chatroom_id !== currentRoom) return;
				if (msg.sender_id === user.id) return;
			} else {
				if (msg.channel_id && msg.channel_id !== currentRoom) return;
				if (msg.from === user.id || msg.sender_id === user.id) return;
			}

			// Normal message format
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

		// Typing indicators
		const handleDisplayTyping = ({ username, channel_id, room_id }) => {
			const currentRoom = isP2P
				? activeRoomRef.current
				: activeChannelRef.current;
			const relevantRoom = room_id || channel_id;

			if (relevantRoom && relevantRoom !== currentRoom) return;
			setTypingUsers((prev) =>
				prev.includes(username) ? prev : [...prev, username],
			);
		};

		const handleHideTyping = ({ channel_id, room_id } = {}) => {
			const currentRoom = isP2P
				? activeRoomRef.current
				: activeChannelRef.current;
			const relevantRoom = room_id || channel_id;

			if (relevantRoom && relevantRoom !== currentRoom) return;
			setTypingUsers([]);
		};

		// Channel-specific handlers
		const handleSocketChannelDeleted = ({ channelId: deletedId }) => {
			if (!isP2P && deletedId === activeChannelRef.current) {
				setMessages([]);
			}
		};

		const handleSocketChannelRenamed = ({ channel }) => {
			if (!isP2P && channel.id === activeChannelRef.current) {
				setCurrentLabel(channel.name);
				if (typeof onChannelRenamed === 'function') onChannelRenamed(channel);
			}
		};

		// Register listeners
		const receiveEvent = isP2P ? 'receive_p2p_message' : 'receive_message';
		const typingEvent = isP2P ? 'Display_p2p_typing' : 'Display_typing';
		const stopTypingEvent = isP2P ? 'hide_p2p_typing' : 'hide_typing';

		socket.on(receiveEvent, handleReceive);
		socket.on(typingEvent, handleDisplayTyping);
		socket.on(stopTypingEvent, handleHideTyping);

		if (!isP2P) {
			socket.on('channel_deleted', handleSocketChannelDeleted);
			socket.on('channel_renamed', handleSocketChannelRenamed);
		}
		if (isP2P) {
			socket.on('p2p_message_deleted', ({ messageId }) => {
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === messageId
							? {
									...msg,
									content: 'This message was deleted',
									is_deleted: true,
								}
							: msg,
					),
				);
			});
		}

		return () => {
			const leaveEvent = isP2P ? 'leave_p2p' : 'leave_institute';
			const currentRoom = isP2P
				? activeRoomRef.current
				: activeChannelRef.current;
			socket.emit(leaveEvent, currentRoom);

			socket.off(receiveEvent, handleReceive);
			socket.off(typingEvent, handleDisplayTyping);
			socket.off(stopTypingEvent, handleHideTyping);
			socket.off('delete_p2p_message');
			socket.off('connect', joinRoom);

			if (!isP2P) {
				socket.off('channel_deleted', handleSocketChannelDeleted);
				socket.off('channel_renamed', handleSocketChannelRenamed);
			}
		};
	}, [channelId, roomId, isP2P, user.id, onChannelRenamed]);

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

			if (isP2P) {
				socket.emit('send_p2p_message', {
					chatroom_id: roomId,
					message: content,
					sender_id: user.id,
					username: user.username,
				});
			} else {
				socket.emit('send_message', {
					channel_id: channelId,
					message: content,
					sender_id: user.id,
					username: user.username,
				});
			}
		},
		[channelId, roomId, isP2P, user],
	);

	const handleTyping = useCallback(() => {
		if (isP2P) {
			socket.emit('typing_p2p', { room_id: roomId, username: user.username });
		} else {
			socket.emit('typing', { channel_id: channelId, username: user.username });
		}
	}, [channelId, roomId, isP2P, user]);

	const handleStopTyping = useCallback(() => {
		if (isP2P) {
			socket.emit('stop_typing_p2p', {
				room_id: roomId,
				username: user.username,
			});
		} else {
			socket.emit('stop_typing', {
				channel_id: channelId,
				username: user.username,
			});
		}
	}, [channelId, roomId, isP2P, user]);

	const handleMessageDeleted = useCallback((id) => {
		setMessages((prev) => prev.filter((m) => (m.id || m._id) !== id));
	}, []);

	const handleChannelDeleted = useCallback(() => {
		setMessages([]);
	}, []);

	const handleChannelRenamed = useCallback(
		(updatedChannel) => {
			setCurrentLabel(updatedChannel.name);
			if (typeof onChannelRenamed === 'function') {
				onChannelRenamed(updatedChannel);
			}
		},
		[onChannelRenamed],
	);
	const handleP2PDelete = async (messageId) => {
		if (!isP2P) return;
		try {
			await deleteP2PMessage(messageId, user.id, roomId);
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === messageId
						? { ...msg, content: 'This message was deleted', is_deleted: true }
						: msg,
				),
			);
			socket.emit('delete_p2p_message', { roomId, messageId });
		} catch (error) {
			console.error('failed to delete message', error);
		}
	};

	return (
		<div className='chat-area'>
			<ChatHeader
				channelId={channelId}
				channelLabel={currentLabel}
				instituteId={instituteId}
				onChannelDeleted={handleChannelDeleted}
				onChannelRenamed={handleChannelRenamed}
				isP2P={isP2P}
				otherUsername={otherUsername}
				onCloseP2P={onCloseP2P}
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
					onMessageDeleted={isP2P ? handleP2PDelete : handleMessageDeleted}
					onStartP2P={onStartP2P}
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
