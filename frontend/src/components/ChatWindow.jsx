import React, { useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useChat } from '../hooks/useChat';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import DateDivider from '../components/DateDivider';
import ChatSkeleton from '../components/ChatSkeleton';
import { formatDate, isSameDay, resolveTimestamp } from '../utils/dateFormat';
import './styles/ChatWindow.css';

export default function ChatWindow({ channelId }) {
	const { user } = useAuth();
	const {
		messages,
		loading,
		typingUser,
		sendMessage,
		handleTyping,
		deleteMsg,
	} = useChat(channelId, user);
	const bottomRef = useRef(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, typingUser]);

	if (!channelId || loading) {
		return <ChatSkeleton isP2P={false} />;
	}

	const sorted = [...messages].sort((a, b) => {
		const ta = resolveTimestamp(a);
		const tb = resolveTimestamp(b);
		if (!ta || !tb) return 0;
		return new Date(ta) - new Date(tb);
	});

	return (
		<div className='chat-window'>
			<div className='chat-header'>
				<span className='chat-header-hash'>#</span>
				<span className='chat-header-name'>{channelId}</span>
				<span className='chat-header-status'>
					<span className='chat-header-dot' />
					Live
				</span>
			</div>

			<div className='chat-messages'>
				{sorted.length === 0 && (
					<div className='chat-no-messages'>
						<p>No messages yet. Say hello!</p>
					</div>
				)}

				{sorted.map((msg, idx) => {
					const prev = sorted[idx - 1];
					const msgTs = resolveTimestamp(msg);
					const prevTs = prev ? resolveTimestamp(prev) : null;
					const showDivider = !prev || !isSameDay(prevTs, msgTs);
					const isOwn =
						msg.sender_id === user?.id || msg.username === user?.username;

					return (
						<React.Fragment key={msg.id || idx}>
							{showDivider && <DateDivider label={formatDate(msgTs)} />}
							<MessageBubble message={msg} isOwn={isOwn} onDelete={deleteMsg} />
						</React.Fragment>
					);
				})}

				<TypingIndicator username={typingUser} />
				<div ref={bottomRef} />
			</div>

			<MessageInput
				onSend={sendMessage}
				onTyping={handleTyping}
				channelName={channelId}
			/>
		</div>
	);
}
