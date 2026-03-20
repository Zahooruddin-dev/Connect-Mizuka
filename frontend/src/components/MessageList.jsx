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
    loading,
}) {
	const bottomRef = useRef(null);
	const [selectedUser, setSelectedUser] = useState(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, typingUsers]);

	return (
		<div className='flex-1 overflow-y-auto py-4'>
			<div className='flex flex-col gap-0.5 px-5 min-h-full justify-end'>
		{messages.length === 0 && !loading && (
    <div className="flex items-center justify-center py-[60px] text-[var(--text-ghost)] text-[13px] italic">
        <span>No messages yet. Start the conversation.</span>
    </div>
)}

{messages.length === 0 && loading && (
    <div className="flex flex-col gap-1 px-4 py-4 justify-end flex-1">
        {[
            { mine: false, w: '52%' },
            { mine: false, w: '38%' },
            { mine: true,  w: '44%' },
            { mine: true,  w: '28%' },
            { mine: false, w: '60%' },
            { mine: true,  w: '48%' },
        ].map((row, i) => (
            <div key={i} className={`flex items-end gap-2.5 py-[3px] ${row.mine ? 'flex-row-reverse' : ''}`}>
                <div className="shimmer w-7 h-7 min-w-[28px] rounded-full mb-[18px] shrink-0" />
                <div className={`flex flex-col max-w-[65%] ${row.mine ? 'items-end' : ''}`}>
                    <div
                        className={`shimmer px-3.5 py-2.5 min-h-[38px] rounded-[var(--radius-lg)] ${row.mine ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'}`}
                        style={{ width: row.w }}
                    />
                    <div className="shimmer h-2.5 w-9 mt-1 rounded" style={{ marginLeft: row.mine ? 'auto' : 4, marginRight: row.mine ? 4 : 'auto' }} />
                </div>
            </div>
        ))}
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
