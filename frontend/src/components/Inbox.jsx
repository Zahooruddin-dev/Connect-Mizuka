import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MessageCircle, MessagesSquare } from 'lucide-react';
import { searchInstituteMembers, searchAllP2PChats } from '../services/api';
import { getOrCreateP2PRoom, markRoomAsRead } from '../services/p2p-api';
import socket from '../services/socket';
import Avatar from './Avatar';

const iconBtnCls =
	'flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';
const searchRowCls =
	'flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 transition-[border-color] duration-150 focus-within:border-[var(--teal-700)]';
const searchInputCls =
	'flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]';
const userItemCls =
	'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-[background] duration-150 hover:bg-[var(--bg-hover)] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

function Inbox({
	activeInstitute,
	currentUser,
	onStartP2P,
	onlineUsers = new Set(),
	activeP2P,
	onUnreadUpdate,
	onJumpToP2PMessage,
	recentChats,
	setRecentChats,
	roomUnread,
	setRoomUnread,
}) {
	const [searchTerm, setSearchTerm] = useState('');
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [startingChat, setStartingChat] = useState(null);
	const [msgSearchOpen, setMsgSearchOpen] = useState(false);
	const [msgSearchTerm, setMsgSearchTerm] = useState('');
	const [msgSearchResults, setMsgSearchResults] = useState([]);
	const [msgSearchLoading, setMsgSearchLoading] = useState(false);

	const debounceTimer = useRef(null);
	const msgDebounceTimer = useRef(null);
	const msgSearchInputRef = useRef(null);

	const recentChatsRef = useRef(recentChats);
	useEffect(() => {
		recentChatsRef.current = recentChats;
	}, [recentChats]);

	useEffect(() => {
		if (msgSearchOpen) msgSearchInputRef.current?.focus();
	}, [msgSearchOpen]);

	useEffect(() => {
		if (!activeP2P?.roomId || !currentUser?.id) return;
		markRoomAsRead(activeP2P.roomId).then(() => {
			onUnreadUpdate?.();
		});
		setRoomUnread((prev) => {
			const next = { ...prev };
			delete next[activeP2P.roomId];
			return next;
		});
	}, [activeP2P?.roomId, currentUser?.id]);

	useEffect(() => {
		return () => {
			clearTimeout(debounceTimer.current);
			clearTimeout(msgDebounceTimer.current);
		};
	}, []);

	const handleSearch = useCallback(
		(val) => {
			setSearchTerm(val);
			clearTimeout(debounceTimer.current);
			if (val.length < 2) {
				setResults([]);
				return;
			}
			setLoading(true);
			debounceTimer.current = setTimeout(async () => {
				try {
					const users = await searchInstituteMembers(
						activeInstitute.id,
						val,
						currentUser.id,
					);
					setResults(users || []);
				} catch {
					setResults([]);
				} finally {
					setLoading(false);
				}
			}, 300);
		},
		[activeInstitute.id, currentUser.id],
	);

	const handleStartChat = useCallback(
		async (user) => {
			if (startingChat === user.id) return;
			setStartingChat(user.id);
			try {
				const res = await getOrCreateP2PRoom(user.id);
				if (res.error || !res.chatroom) return;
				socket.emit('join_p2p', res.chatroom.id);
				const entry = {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					profile_picture: user.profile_picture || null,
					roomId: res.chatroom.id,
					lastChat: new Date().toISOString(),
				};
				setRecentChats((prev) => {
					const idx = prev.findIndex((c) => c.roomId === entry.roomId);
					const next =
						idx !== -1
							? prev.map((c, i) => (i === idx ? { ...c, ...entry } : c))
							: [entry, ...prev].slice(0, 20);
					localStorage.setItem('mizuka_recent_p2p_chats', JSON.stringify(next));
					return next;
				});
				onStartP2P?.({
					roomId: res.chatroom.id,
					otherUserId: user.id,
					otherUsername: user.username,
				});
				setSearchTerm('');
				setResults([]);
			} catch {
			} finally {
				setStartingChat(null);
			}
		},
		[onStartP2P, startingChat, setRecentChats],
	);

	const handleClearSearch = useCallback(() => {
		setSearchTerm('');
		setResults([]);
	}, []);

	const handleMsgSearchInput = useCallback((val) => {
		setMsgSearchTerm(val);
		clearTimeout(msgDebounceTimer.current);

		if (!val.trim() || val.length < 2) {
			setMsgSearchResults([]);
			return;
		}

		setMsgSearchLoading(true);
		msgDebounceTimer.current = setTimeout(async () => {
			const chats = recentChatsRef.current;
			if (!chats.length) {
				setMsgSearchLoading(false);
				return;
			}

			try {
				const raw = await searchAllP2PChats(
					chats.map((c) => c.roomId),
					val,
				);
				const results = raw.map((msg) => {
					const chat = chats.find((c) => c.roomId === msg.room_id);
					return {
						...msg,
						roomId: msg.room_id,
						otherUserId: chat?.id,
						otherUsername: chat?.username,
					};
				});
				results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				setMsgSearchResults(results);
			} catch {
				setMsgSearchResults([]);
			} finally {
				setMsgSearchLoading(false);
			}
		}, 300);
	}, []);

	const handleMsgResultClick = useCallback(
		(result) => {
			onJumpToP2PMessage?.(
				result.roomId,
				result.id,
				result.otherUserId,
				result.otherUsername,
			);
			setMsgSearchOpen(false);
			setMsgSearchTerm('');
			setMsgSearchResults([]);
		},
		[onJumpToP2PMessage],
	);

	const handleCloseMsgSearch = useCallback(() => {
		setMsgSearchOpen(false);
		setMsgSearchTerm('');
		setMsgSearchResults([]);
	}, []);

	const isOnline = useCallback(
		(userId) => onlineUsers.has(String(userId)),
		[onlineUsers],
	);
	const getUnread = useCallback(
		(roomId) => roomUnread[roomId] || 0,
		[roomUnread],
	);
	

	return (
		<div className='flex flex-col flex-1 overflow-hidden'>
			<div className='flex items-center justify-between px-3 mb-2 shrink-0'>
				<span className='text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)]'>
					Direct Messages
				</span>
				{recentChats.length > 0 && (
					<button
						className={`${iconBtnCls} ${msgSearchOpen ? 'bg-[var(--bg-hover)] text-[var(--text-muted)]' : ''}`}
						onClick={() => setMsgSearchOpen((v) => !v)}
						aria-label='Search messages'
						aria-expanded={msgSearchOpen}
						title='Search messages'
						onTouchStart={(e) => e.stopPropagation()}
					>
						<MessagesSquare size={13} strokeWidth={2} />
					</button>
				)}
			</div>

			{msgSearchOpen && (
				<div className='mx-2 mb-2 shrink-0'>
					<div className={searchRowCls}>
						<Search size={12} className='text-[var(--text-ghost)] shrink-0' />
						<input
							ref={msgSearchInputRef}
							type='text'
							inputMode='text'
							autoComplete='off'
							autoCorrect='off'
							autoCapitalize='off'
							spellCheck={false}
							className={searchInputCls}
							style={{ fontSize: '16px' }}
							placeholder='Search conversations…'
							value={msgSearchTerm}
							onChange={(e) => handleMsgSearchInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Escape' && handleCloseMsgSearch()}
						/>
						{msgSearchTerm && (
							<button
								className={iconBtnCls}
								onClick={handleCloseMsgSearch}
								aria-label='Clear'
							>
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
										className='w-full flex flex-col gap-0.5 px-2.5 py-2 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
										onClick={() => handleMsgResultClick(result)}
										title={result.content}
									>
										<div className='flex items-center gap-1.5'>
											<span
												className='w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold text-white/90 shrink-0'
												style={{
													background:
														'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
												}}
												aria-hidden='true'
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

			<div className='mx-2 mb-2 shrink-0'>
				<div className={searchRowCls}>
					<Search size={12} className='text-[var(--text-ghost)] shrink-0' />
					<input
						type='text'
						inputMode='text'
						autoComplete='off'
						autoCorrect='off'
						autoCapitalize='off'
						spellCheck={false}
						placeholder='Search members...'
						value={searchTerm}
						onChange={(e) => handleSearch(e.target.value)}
						className={searchInputCls}
						style={{ fontSize: '16px' }}
					/>
					{searchTerm && (
						<button
							className={iconBtnCls}
							onClick={handleClearSearch}
							aria-label='Clear search'
						>
							<X size={11} />
						</button>
					)}
				</div>
			</div>

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
										onClick={() => handleStartChat(user)}
										disabled={startingChat === user.id}
										title={`Message ${user.username}`}
									>
										<div className='relative shrink-0'>
											<Avatar
												src={user.profile_picture || null}
												username={user.username}
												size={32}
											/>
											{isOnline(user.id) && (
												<span
													className='absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-[var(--bg-surface)]'
													aria-hidden='true'
												/>
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
											aria-hidden='true'
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
								<p className='text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)] px-3 py-1.5'>
									Recent
								</p>
								<div className='flex flex-col gap-0.5'>
									{recentChats.map((chat) => {
										const unread = getUnread(chat.roomId);
										const lastMsg = chat.lastMessage;
										console.log(lastMsg);
										

										return (
											<button
												key={chat.roomId}
												className={`${userItemCls} ${unread > 0 ? 'bg-[var(--bg-hover)]' : ''}`}
												onClick={() =>
													handleStartChat({
														id: chat.id,
														username: chat.username,
														email: chat.email,
														role: chat.role,
													})
												}
												disabled={startingChat === chat.id}
												title={`Message ${chat.username}`}
											>
												<div className='relative shrink-0'>
													<Avatar
														src={chat.profile_picture || null}
														username={chat.username}
														size={32}
													/>
													{isOnline(chat.id) && (
														<span
															className='absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-[var(--bg-surface)]'
															aria-hidden='true'
														/>
													)}
												</div>
												<div className='min-w-0 flex-1'>
													<div
														className={`text-[13px] truncate ${unread > 0 ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}
													>
														{chat.username}
													</div>
													{lastMsg ? (
														<div
															className={`text-[11px] truncate ${unread > 0 ? 'text-[var(--text-muted)]' : 'text-[var(--text-ghost)]'}`}
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
																		aria-hidden='true'
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
														className='text-[var(--text-ghost)] shrink-0 opacity-0 group-hover:opacity-100'
														aria-hidden='true'
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
	);
}

export default Inbox;
