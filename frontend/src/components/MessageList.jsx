import { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import UserProfilePopover from './Userprofilepopover';

function MessageList({
	messages,
	typingUsers,
	currentUserId,
	currentUserPicture,
	onMessageDeleted,
	onMessageEdited,
	onStartP2P,
}) {
	const bottomRef = useRef(null);
	const [selectedUser, setSelectedUser] = useState(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, typingUsers]);

	return (
		<div className='flex-1 overflow-y-auto py-4'>
			<div className='flex flex-col gap-0.5 px-5 min-h-full justify-end'>
				{messages.length === 0 && (
					<div className='flex items-center justify-center py-[60px] text-[var(--text-ghost)] text-[13px] italic'>
						<span>No messages yet. Start the conversation.</span>
					</div>
				)}
				{messages.filter(Boolean).map((msg) => (
					<MessageItem
						key={msg._id || msg.id || msg.tempId}
						message={msg}
						currentUserId={currentUserId}
						currentUserPicture={currentUserPicture}
						onDeleted={onMessageDeleted}
						onEdit={onMessageEdited}
						onUserClick={(userId) => setSelectedUser(userId)}
					/>
				))}
				{typingUsers.length > 0 && (
					<div className='flex items-center gap-2.5 py-2 px-1 animate-[msg-in_0.2s_ease]'>
						<div className='flex items-center gap-1 px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] rounded-bl-[4px]'>
							{[0, 200, 400].map((delay) => (
								<span
									key={delay}
									className='w-[5px] h-[5px] rounded-full bg-[var(--teal-800)] animate-[bounce-dot_1.2s_ease-in-out_infinite]'
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
						<span className='text-[12px] text-[var(--text-muted)] italic'>
							{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'}{' '}
							typing
						</span>
					</div>
				)}
				<div ref={bottomRef} />
			</div>

			{selectedUser && (
				<UserProfilePopover
					userId={selectedUser}
					onClose={() => setSelectedUser(null)}
					onStartP2P={onStartP2P}
				/>
			)}
		</div>
	);
}

export default MessageList;
