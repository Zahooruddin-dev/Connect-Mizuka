import { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import UserProfilePopover from './Userprofilepopover';

export default function MessageList({
	messages,
	typingUsers,
	currentUserId,
	currentUserPicture,
	onMessageDeleted,
	onMessageEdited,
	onStartP2P,
	loading,
}) {
	const scrollContainerRef = useRef(null);
	const bottomRef = useRef(null);
	const [selectedUser, setSelectedUser] = useState(null);
	const [showScrollButton, setShowScrollButton] = useState(false);
	const [isNearBottom, setIsNearBottom] = useState(true);
	const [prevMessageCount, setPrevMessageCount] = useState(messages.length);


	const checkIfNearBottom = () => {
		if (!scrollContainerRef.current) return false;
		const { scrollTop, scrollHeight, clientHeight } =
			scrollContainerRef.current;
		return scrollHeight - scrollTop - clientHeight < 100;
	};

	// Smoothly scroll to the bottom of the container
	const scrollToBottom = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: scrollContainerRef.current.scrollHeight,
				behavior: 'smooth',
			});
		}
	};

	const handleScroll = () => {
		if (!scrollContainerRef.current) return;
		const nearBottom = checkIfNearBottom();
		setIsNearBottom(nearBottom);
		setShowScrollButton(!nearBottom);
	};

	
	useEffect(() => {
		const newMessageCount = messages.length;
		const isNewMessage = newMessageCount > prevMessageCount;
		const typingChanged =
			typingUsers.length > 0 && prevMessageCount === newMessageCount;
		if ((isNewMessage || typingChanged) && isNearBottom) {
			scrollToBottom();
		}
		setPrevMessageCount(newMessageCount);
	}, [messages, typingUsers, isNearBottom, prevMessageCount]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		container.addEventListener('scroll', handleScroll);
		handleScroll(); // initial check
		return () => container.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		handleScroll();
	}, [messages]);

	return (
		<>
			<style>{`
        @keyframes msg-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }
          40% {
            transform: translateY(-4px);
            opacity: 0.8;
          }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            var(--bg-hover) 0%,
            var(--border) 50%,
            var(--bg-hover) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

			<div ref={scrollContainerRef} className='flex-1 overflow-y-auto py-4'>
				<div className='flex flex-col gap-0.5 px-5 min-h-full justify-end'>
					{/* Loading skeleton */}
					{loading && messages.length === 0 && (
						<div className='flex flex-col gap-1 py-4 justify-end flex-1'>
							{[
								{ mine: false, w: '52%' },
								{ mine: false, w: '38%' },
								{ mine: true, w: '44%' },
								{ mine: true, w: '28%' },
								{ mine: false, w: '60%' },
								{ mine: true, w: '48%' },
							].map((row, i) => (
								<div
									key={i}
									className={`flex items-end gap-2.5 py-[3px] ${
										row.mine ? 'flex-row-reverse' : ''
									}`}
								>
									<div className='shimmer w-7 h-7 min-w-[28px] rounded-full mb-[18px] shrink-0' />
									<div
										className={`flex flex-col max-w-[65%] ${
											row.mine ? 'items-end' : ''
										}`}
									>
										<div
											className={`shimmer px-3.5 py-2.5 min-h-[38px] rounded-2xl ${
												row.mine ? 'rounded-br-md' : 'rounded-bl-md'
											}`}
											style={{ width: row.w }}
										/>
										<div
											className='shimmer h-2.5 w-9 mt-1 rounded'
											style={{
												marginLeft: row.mine ? 'auto' : 4,
												marginRight: row.mine ? 4 : 'auto',
											}}
										/>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Empty state */}
					{!loading && messages.length === 0 && (
						<div className='flex items-center justify-center py-[60px] text-[var(--text-ghost)] text-[13px] italic'>
							<span>No messages yet. Start the conversation.</span>
						</div>
					)}

					{/* Message list */}
					{messages.filter(Boolean).map((msg) => (
						<MessageItem
							key={
								msg._id ||
								msg.id ||
								msg.tempId ||
								`temp-${Date.now()}-${Math.random()}`
							}
							message={msg}
							currentUserId={currentUserId}
							currentUserPicture={currentUserPicture}
							onDeleted={onMessageDeleted}
							onEdit={onMessageEdited}
							onUserClick={(userId) => setSelectedUser(userId)}
						/>
					))}

					{/* Typing indicator */}
					{typingUsers.length > 0 && (
						<div className='flex items-center gap-2.5 py-2 px-1 animate-[msg-in_0.2s_ease-out]'>
							<div className='flex items-center gap-1 px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl rounded-bl-md'>
								{[0, 200, 400].map((delay) => (
									<span
										key={delay}
										className='w-1.5 h-1.5 rounded-full bg-teal-600 animate-[bounce-dot_1.2s_ease-in-out_infinite]'
										style={{ animationDelay: `${delay}ms` }}
									/>
								))}
							</div>
							<span className='text-[12px] text-[var(--text-muted)] italic'>
								{typingUsers.join(', ')}{' '}
								{typingUsers.length === 1 ? 'is' : 'are'} typing
							</span>
						</div>
					)}

					<div ref={bottomRef} />
				</div>
			</div>

			{showScrollButton && (
				<button
					onClick={scrollToBottom}
					className='fixed left-6 bottom-6 z-50 bg-[var(--bg-panel)] border border-[var(--border)] rounded-full p-3 shadow-lg hover:bg-[var(--bg-hover)] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-teal-500'
					aria-label='Scroll to latest message'
				>
					<svg
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						className='text-[var(--text-primary)] group-hover:scale-110 transition-transform'
					>
						<polyline points='6 9 12 15 18 9' />
					</svg>
				</button>
			)}

			{selectedUser && (
				<UserProfilePopover
					userId={selectedUser}
					onClose={() => setSelectedUser(null)}
					onStartP2P={onStartP2P}
				/>
			)}
		</>
	);
}
