import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';
import {
	fetchMessages,
	fetchP2PMessages,
	deleteP2PMessage,
	editP2PMessage,
} from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';


const channelCache = new Map();
const p2pCache = new Map();

function getCache(isP2P) {
	return isP2P ? p2pCache : channelCache;
}

function ChatArea({
	channelId,
	channelLabel,
	instituteId,
	roomId,
	otherUsername,
	otherUserId,
	user,
	isAdmin,
	onChannelRenamed,
	onStartP2P,
	onCloseP2P,
	highlightMessageId,
	onHighlightConsumed,
}) {
	const isP2P = !!roomId;
	const activeId = isP2P ? roomId : channelId;
	const cached = getCache(isP2P).get(activeId);

	const [messages, setMessages] = useState(cached || []);
	const [typingUsers, setTypingUsers] = useState([]);
	const [loading, setLoading] = useState(!cached);
	const [currentLabel, setCurrentLabel] = useState(
		channelLabel || otherUsername,
	);
	const [retryCount, setRetryCount] = useState(0);

	const activeIdRef = useRef(activeId);
	const messagesRef = useRef(messages);

	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);
	useEffect(() => {
		setCurrentLabel(channelLabel || otherUsername);
	}, [channelLabel, otherUsername]);

	const setAndCache = useCallback(
		(updater) => {
			setMessages((prev) => {
				const next = typeof updater === 'function' ? updater(prev) : updater;
				getCache(isP2P).set(activeId, next);
				return next;
			});
		},
		[isP2P, activeId],
	);

	useEffect(() => {
		if (!highlightMessageId || loading) return;
		const attempt = (tries = 0) => {
			const el = document.querySelector(
				`[data-message-id="${highlightMessageId}"]`,
			);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				el.classList.add('message-highlight');
				setTimeout(() => el.classList.remove('message-highlight'), 2000);
				onHighlightConsumed?.();
			} else if (tries < 8) {
				setTimeout(() => attempt(tries + 1), 120);
			}
		};
		attempt();
	}, [highlightMessageId, loading]);

	useEffect(() => {
		activeIdRef.current = activeId;

		const hit = getCache(isP2P).get(activeId);
		if (hit) {
			setMessages(hit);
			setLoading(false);
		} else {
			setMessages([]);
			setLoading(true);
		}

		setTypingUsers([]);

		const joinRoom = () =>
			socket.emit(isP2P ? 'join_p2p' : 'join_institute', activeId);
		if (socket.connected) joinRoom();
		else socket.once('connect', joinRoom);

		const fetchFn = isP2P
			? () => fetchP2PMessages(activeId)
			: () => fetchMessages(activeId);

		fetchFn()
			.then((res) => {
				if (activeIdRef.current !== activeId) return;
				const fresh = Array.isArray(res.data)
					? res.data
					: res.data.messages || [];
				const current = messagesRef.current;
				const changed =
					fresh.length !== current.length ||
					fresh.some((m, i) => m.id !== current[i]?.id);
				if (changed) setAndCache(fresh);
			})
			.catch(() => {
				if (activeIdRef.current !== activeId) return;
				if (!getCache(isP2P).get(activeId)?.length) setMessages([]);
			})
			.finally(() => {
				if (activeIdRef.current === activeId) setLoading(false);
			});

		const handleReceive = (msg) => {
			if (activeIdRef.current !== activeId) return;

			if (isP2P) {
				if (msg.chatroom_id && msg.chatroom_id !== activeId) return;
				if (msg.sender_id === user.id) {
					setAndCache((prev) => {
						const idx = prev.findIndex(
							(m) =>
								String(m.id).startsWith('temp-') &&
								m.content === msg.content &&
								m.sender_id === user.id,
						);
						if (idx === -1) return prev;
						const next = [...prev];
						next[idx] = {
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
			} else {
				if (msg.channel_id && msg.channel_id !== activeId) return;
				if (msg.from === user.id || msg.sender_id === user.id) return;
			}

			const normalised = {
				id: msg.id,
				content: msg.text ?? msg.content,
				type: msg.type || 'text',
				sender_id: msg.from ?? msg.sender_id,
				username: msg.username,
				profile_picture: msg.profile_picture || null,
				created_at: msg.timestamp ?? msg.created_at,
			};

			setAndCache((prev) => {
				if (prev.some((m) => m.id === normalised.id)) return prev;
				return [...prev, normalised];
			});
		};

		const handleDisplayTyping = ({ username, channel_id, room_id }) => {
			const relevantRoom = room_id || channel_id;
			if (relevantRoom && relevantRoom !== activeId) return;
			setTypingUsers((prev) =>
				prev.includes(username) ? prev : [...prev, username],
			);
		};

		const handleHideTyping = ({ channel_id, room_id } = {}) => {
			const relevantRoom = room_id || channel_id;
			if (relevantRoom && relevantRoom !== activeId) return;
			setTypingUsers([]);
		};

		const handleChannelDeleted = ({ channelId: deletedId }) => {
			if (deletedId === activeIdRef.current) setMessages([]);
		};

		const handleChannelRenamed = ({ channel }) => {
			if (channel.id !== activeIdRef.current) return;
			setCurrentLabel(channel.name);
			if (typeof onChannelRenamed === 'function') onChannelRenamed(channel);
		};

		const handleP2PDeleted = ({ messageId }) => {
			setAndCache((prev) =>
				prev.map((msg) =>
					msg.id === messageId
						? { ...msg, content: 'This message was deleted', is_deleted: true }
						: msg,
				),
			);
		};

		const handleP2PEdited = ({ messageId, newContent }) => {
			setAndCache((prev) =>
				prev.map((msg) =>
					msg.id === messageId
						? { ...msg, content: newContent, is_deleted: false }
						: msg,
				),
			);
		};

		const receiveEvent = isP2P ? 'receive_p2p_message' : 'receive_message';
		const typingEvent = isP2P ? 'Display_p2p_typing' : 'Display_typing';
		const stopTypingEvent = isP2P ? 'hide_p2p_typing' : 'hide_typing';

		socket.on(receiveEvent, handleReceive);
		socket.on(typingEvent, handleDisplayTyping);
		socket.on(stopTypingEvent, handleHideTyping);

		if (!isP2P) {
			socket.on('channel_deleted', handleChannelDeleted);
			socket.on('channel_renamed', handleChannelRenamed);
		} else {
			socket.on('p2p_message_deleted', handleP2PDeleted);
			socket.on('p2p_message_edited', handleP2PEdited);
		}

		return () => {
			socket.emit(isP2P ? 'leave_p2p' : 'leave_institute', activeId);
			socket.off(receiveEvent, handleReceive);
			socket.off(typingEvent, handleDisplayTyping);
			socket.off(stopTypingEvent, handleHideTyping);
			socket.off('connect', joinRoom);
			if (!isP2P) {
				socket.off('channel_deleted', handleChannelDeleted);
				socket.off('channel_renamed', handleChannelRenamed);
			} else {
				socket.off('p2p_message_deleted', handleP2PDeleted);
				socket.off('p2p_message_edited', handleP2PEdited);
			}
		};
	}, [channelId, roomId, isP2P, user.id, retryCount, onChannelRenamed]);

	const handleSend = useCallback(
		(content) => {
			const type = content.startsWith('https://res.cloudinary.com')
				? 'audio'
				: 'text';
			const tempMessage = {
				id: `temp-${Date.now()}`,
				content,
				type,
				sender_id: user.id,
				username: user.username,
				created_at: new Date().toISOString(),
			};
			setAndCache((prev) => [...prev, tempMessage]);
			if (isP2P) {
				socket.emit('send_p2p_message', {
					chatroom_id: roomId,
					message: content,
					sender_id: user.id,
					username: user.username,
					type,
				});
			} else {
				socket.emit('send_message', {
					channel_id: channelId,
					message: content,
					sender_id: user.id,
					username: user.username,
					type,
				});
			}
		},
		[channelId, roomId, isP2P, user, setAndCache],
	);

	const handleTyping = useCallback(() => {
		if (isP2P)
			socket.emit('typing_p2p', { room_id: roomId, username: user.username });
		else
			socket.emit('typing', { channel_id: channelId, username: user.username });
	}, [channelId, roomId, isP2P, user]);

	const handleStopTyping = useCallback(() => {
		if (isP2P)
			socket.emit('stop_typing_p2p', {
				room_id: roomId,
				username: user.username,
			});
		else
			socket.emit('stop_typing', {
				channel_id: channelId,
				username: user.username,
			});
	}, [channelId, roomId, isP2P, user]);

	const handleP2PDelete = useCallback(
		async (messageId) => {
			try {
				await deleteP2PMessage(messageId, user.id, roomId);
				setAndCache((prev) =>
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
				socket.emit('delete_p2p_message', { roomId, messageId });
			} catch (err) {
				console.error('failed to delete message', err);
			}
		},
		[roomId, user.id, setAndCache],
	);

	const handleP2PEdit = useCallback(
		async (messageId, newContent) => {
			try {
				await editP2PMessage(messageId, user.id, roomId, newContent);
				setAndCache((prev) =>
					prev.map((msg) =>
						msg.id === messageId
							? { ...msg, content: newContent, is_deleted: false }
							: msg,
					),
				);
				socket.emit('edit_p2p_message', {
					roomId,
					messageId,
					content: newContent,
				});
			} catch (err) {
				console.error('failed to edit message', err);
			}
		},
		[roomId, user.id, setAndCache],
	);

	const handleMessageDeleted = useCallback(
		(id) => setAndCache((prev) => prev.filter((m) => (m.id || m._id) !== id)),
		[setAndCache],
	);
	const handleChannelDeletedCb = useCallback(() => setMessages([]), []);
	const handleChannelRenamedCb = useCallback(
		(updatedChannel) => {
			setCurrentLabel(updatedChannel.name);
			if (typeof onChannelRenamed === 'function')
				onChannelRenamed(updatedChannel);
		},
		[onChannelRenamed],
	);
	const handleRetry = useCallback(() => setRetryCount((c) => c + 1), []);

	// ── Render ──────────────────────────────────────────────────────────────

	return (
		<div className='flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]'>
			<ChatHeader
				channelId={channelId}
				channelLabel={currentLabel}
				instituteId={instituteId}
				onChannelDeleted={handleChannelDeletedCb}
				onChannelRenamed={handleChannelRenamedCb}
				isP2P={isP2P}
				otherUsername={otherUsername}
				otherUserId={otherUserId || null}
				onCloseP2P={onCloseP2P}
				isAdmin={isAdmin}
			/>
			<MessageList
				messages={messages}
				typingUsers={typingUsers.filter((u) => u !== user.username)}
				currentUserId={user.id}
				currentUserPicture={user.profile_picture || null}
				onMessageDeleted={isP2P ? handleP2PDelete : handleMessageDeleted}
				onMessageEdited={handleP2PEdit}
				onStartP2P={onStartP2P}
				onRetry={handleRetry}
				loading={loading}
			/>
			<MessageInput
				onSend={handleSend}
				onTyping={handleTyping}
				onStopTyping={handleStopTyping}
			/>
		</div>
	);
}

export default ChatArea;
