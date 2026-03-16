import { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import UserProfilePopover from './Userprofilepopover';
import './styles/MessageList.css';

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
		<div className='message-list'>
			<div className='message-list-inner'>
				{messages.length === 0 && (
					<div className='message-empty'>
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
					<div className='typing-indicator'>
						<div className='typing-dots'>
							<span />
							<span />
							<span />
						</div>
						<span className='typing-label'>
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
