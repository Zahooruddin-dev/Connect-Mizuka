import { Search, X, MessageCircle, MessagesSquare } from 'lucide-react';
import Avatar from './Avatar';

const iconBtnCls =
	'flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-ghost)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';
const searchRowCls =
	'flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-2.5 py-1.5 transition-colors focus-within:border-[var(--teal-700)]';
const userItemCls =
	'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-all duration-150 hover:bg-[var(--bg-hover)] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

export default function InboxContent({
	currentUser,
	onlineUsers = new Set(),
	recentChats,
	roomUnread,

	searchTerm,
	results,
	loading,
	startingChat,
	msgSearchOpen,
	msgSearchTerm,
	msgSearchResults,
	msgSearchLoading,

	onSearchChange,
	onClearSearch,
	onStartChat,
	onToggleMsgSearch,
	onMsgSearchChange,
	onClearMsgSearch,
	onMsgResultClick,

	msgSearchInputRef,
}) {
	const isOnline = (userId) => onlineUsers.has(String(userId));
	const getUnread = (roomId) => roomUnread[roomId] || 0;

	return (
		<>
			<style>{`
        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-pop {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          60% {
            opacity: 1;
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

			<div className='flex flex-col flex-1 overflow-hidden'>
				{/* Header */}
				<div className='flex items-center justify-between px-3 mb-2 shrink-0'>
					<span className='text-[11px] font-medium uppercase tracking-wide text-[var(--text-ghost)]'>
						Direct Messages
					</span>
					{recentChats.length > 0 && (
						<button
							className={`${iconBtnCls} ${msgSearchOpen ? 'bg-[var(--bg-hover)] text-[var(--text-muted)]' : ''}`}
							onClick={onToggleMsgSearch}
							aria-label='Search messages'
							aria-expanded={msgSearchOpen}
						>
							<MessagesSquare size={13} strokeWidth={2} />
						</button>
					)}
				</div>

				{/* Message search */}
				{msgSearchOpen && (
					<div className='mx-2 mb-2 shrink-0'>
						<div className={searchRowCls}>
							<Search size={12} className='text-[var(--text-ghost)] shrink-0' />
							<input
								ref={msgSearchInputRef}
								type='text'
								className='flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] text-[13px]'
								placeholder='Search conversations…'
								value={msgSearchTerm}
								onChange={(e) => onMsgSearchChange(e.target.value)}
								onKeyDown={(e) => e.key === 'Escape' && onClearMsgSearch()}
							/>
							{msgSearchTerm && (
								<button className={iconBtnCls} onClick={onClearMsgSearch}>
									<X size={11} />
								</button>
							)}
						</div>
						{msgSearchLoading && (
							<p className='text-[12px] text-[var(--text-ghost)] px-1 py-1.5'>
								Searching…
							</p>
						)}
						{!msgSearchLoading &&
							msgSearchTerm.length >= 2 &&
							msgSearchResults.length === 0 && (
								<p className='text-[12px] text-[var(--text-ghost)] px-1 py-1.5'>
									No results found
								</p>
							)}
						{msgSearchResults.length > 0 && (
							<ul className='mt-1 flex flex-col gap-0.5'>
								{msgSearchResults.map((result) => (
									<li key={`${result.roomId}-${result.id}`}>
										<button
											className='w-full flex flex-col gap-0.5 px-2.5 py-2 rounded-md text-left hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
											onClick={() => onMsgResultClick(result)}
										>
											<div className='flex items-center gap-1.5'>
												<span
													className='w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold text-white/90 shrink-0'
													style={{
														background:
															'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
													}}
												>
													{result.otherUsername?.[0]?.toUpperCase() || 'U'}
												</span>
												<span className='text-[12px] font-medium text-[var(--text-secondary)] truncate'>
													{result.otherUsername}
												</span>
											</div>
											<span className='text-[12px] text-[var(--text-ghost)] leading-snug line-clamp-1 pl-[22px]'>
												{result.content?.length > 80
													? result.content.slice(0, 80) + '…'
													: result.content}
											</span>
											{result.username && (
												<span className='text-[10px] text-[var(--text-ghost)] pl-[22px]'>
													{result.username === currentUser.username
														? 'You'
														: result.username}
												</span>
											)}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				)}

				{/* Member search */}
				<div className='mx-2 mb-2 shrink-0'>
					<div className={searchRowCls}>
						<Search size={12} className='text-[var(--text-ghost)] shrink-0' />
						<input
							type='text'
							className='flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] text-[13px]'
							placeholder='Search members...'
							value={searchTerm}
							onChange={(e) => onSearchChange(e.target.value)}
						/>
						{searchTerm && (
							<button className={iconBtnCls} onClick={onClearSearch}>
								<X size={11} />
							</button>
						)}
					</div>
				</div>

				{/* Main list area */}
				<div className='flex-1 overflow-y-auto px-1'>
					{searchTerm ? (
						<>
							{loading ? (
								<p className='text-[12px] text-[var(--text-ghost)] px-3 py-2'>
									Searching...
								</p>
							) : results.length > 0 ? (
								<div className='flex flex-col gap-0.5'>
									{results.map((user) => (
										<button
											key={user.id}
											className={userItemCls}
											onClick={() => onStartChat(user)}
											disabled={startingChat === user.id}
										>
											<div className='relative shrink-0'>
												<Avatar
													src={user.profile_picture || null}
													username={user.username}
													size={32}
												/>
												{isOnline(user.id) && (
													<span className='absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-1 ring-[var(--bg-surface)]' />
												)}
											</div>
											<div className='min-w-0 flex-1'>
												<div className='text-[13px] font-medium text-[var(--text-primary)] truncate'>
													{user.username}
												</div>
												<div className='text-[11px] text-[var(--text-ghost)] truncate capitalize'>
													{user.role}
												</div>
											</div>
											<MessageCircle
												size={14}
												className='text-[var(--text-ghost)] shrink-0'
											/>
										</button>
									))}
								</div>
							) : (
								<p className='text-[12px] text-[var(--text-ghost)] px-3 py-2 italic'>
									No members found
								</p>
							)}
						</>
					) : (
						<>
							{recentChats.length > 0 ? (
								<>
									<p className='text-[10px] font-medium uppercase tracking-wide text-[var(--text-ghost)] px-3 py-1.5'>
										Recent
									</p>
									<div className='flex flex-col gap-0.5'>
										{recentChats.map((chat) => {
											const unread = getUnread(chat.roomId);
											const lastMsg = chat.lastMessage;
											return (
												<button
													key={chat.roomId}
													className={`${userItemCls} group ${unread > 0 ? 'bg-[var(--bg-hover)]' : ''}`}
													onClick={() =>
														onStartChat({
															id: chat.id,
															username: chat.username,
															email: chat.email,
															role: chat.role,
														})
													}
													disabled={startingChat === chat.id}
												>
													<div className='relative shrink-0'>
														<Avatar
															src={chat.profile_picture || null}
															username={chat.username}
															size={32}
														/>
														{isOnline(chat.id) && (
															<span className='absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-1 ring-[var(--bg-surface)]' />
														)}
													</div>
													<div className='min-w-0 flex-1'>
														<div
															className={`text-[13px] truncate ${
																unread > 0
																	? 'font-semibold text-[var(--text-primary)]'
																	: 'font-medium text-[var(--text-secondary)]'
															}`}
														>
															{chat.username}
														</div>
														{lastMsg ? (
															<div
																className={`text-[11px] truncate ${
																	unread > 0
																		? 'text-[var(--text-muted)]'
																		: 'text-[var(--text-ghost)]'
																}`}
															>
																{lastMsg.fromMe && (
																	<span className='text-[var(--text-ghost)]'>
																		You:{' '}
																	</span>
																)}
																{lastMsg.type === 'audio' ? (
																	<span className='flex items-center gap-1'>
																		<svg
																			width='10'
																			height='10'
																			viewBox='0 0 24 24'
																			fill='none'
																			stroke='currentColor'
																			strokeWidth='2'
																			strokeLinecap='round'
																			strokeLinejoin='round'
																		>
																			<path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' />
																			<path d='M19 10v2a7 7 0 0 1-14 0v-2' />
																			<line x1='12' y1='19' x2='12' y2='23' />
																			<line x1='8' y1='23' x2='16' y2='23' />
																		</svg>
																		Voice message
																	</span>
																) : lastMsg.content?.length > 40 ? (
																	lastMsg.content.slice(0, 40) + '…'
																) : (
																	lastMsg.content
																)}
															</div>
														) : (
															<div className='text-[11px] text-[var(--text-ghost)] truncate capitalize'>
																{chat.role}
															</div>
														)}
													</div>
													{unread > 0 ? (
														<span className='flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--teal-600)] text-white text-[10px] font-semibold shrink-0'>
															{unread > 99 ? '99+' : unread}
														</span>
													) : (
														<MessageCircle
															size={14}
															className='text-[var(--text-ghost)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
														/>
													)}
												</button>
											);
										})}
									</div>
								</>
							) : (
								<p className='text-[12px] text-[var(--text-ghost)] px-3 py-3 italic'>
									No recent chats. Search to start one!
								</p>
							)}
						</>
					)}
				</div>
			</div>
		</>
	);
}
