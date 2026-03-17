import React, { useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useChat } from '../hooks/useChat';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import DateDivider from '../components/DateDivider';
import ChatSkeleton from '../components/ChatSkeleton';
import { formatDate, isSameDay, resolveTimestamp } from '../utils/dateFormat';

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
		<div className='flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-surface)]'>
			<div className='h-[var(--header-height)] flex items-center gap-2 px-5 border-b border-[var(--border)] shrink-0 bg-[var(--bg-surface)]'>
				<span className='font-mono text-base text-[var(--text-ghost)]'>#</span>
				<span className='text-sm font-medium text-[var(--text-primary)] tracking-[-0.1px]'>
					{channelId}
				</span>
				<div className='ml-auto flex items-center gap-[5px] text-[11px] text-[var(--text-muted)]'>
					<span className='w-1.5 h-1.5 rounded-full bg-green-500 opacity-70' />
					Live
				</div>
			</div>

			<div className='flex-1 overflow-y-auto pt-3 pb-1 flex flex-col'>
				{sorted.length === 0 && (
					<div className='flex-1 flex items-center justify-center text-[var(--text-muted)] text-[13px]'>
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
