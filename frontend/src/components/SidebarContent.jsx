import {
	Hash,
	Plus,
	LogOut,
	ChevronDown,
	X,
	Building2,
	Inbox as InboxIcon,
	Search,
} from 'lucide-react';
import InstituteSidebar from './InstituteSidebar';
import CreateChannelModal from './CreateChannelModal';
import UserProfilePanel from './UserProfilePanel';
import Inbox from './Inbox';

const iconBtnCls =
	'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

export default function SidebarContent({
	isOpen,
	onClose,
	activeInstitute,
	onOpenPanel,
	tabs,
	activeTab,
	onTabChange,
	unreadCount,
	channels,
	searchOpen,
	onSearchToggle,
	searchTerm,
	onSearchChange,
	onSearchClear,
	searchLoading,
	searchResults,
	onSearchResultClick,
	isAdmin,
	onCreateChannel,
	activeChannel,
	onChannelSelect,
	user,
	onOpenProfile,
	onToggleTheme,
	theme,
	onLogout,
	panelOpen,
	onClosePanel,
	onStartP2P,
	createModalOpen,
	onCloseCreate,
	handleCreateChannel,
	isProfileOpen,
	onCloseProfile,
	onlineUsers,
	activeP2P,
	onUnreadUpdate,
	onJumpToP2PMessage,
	recentChats,
	setRecentChats,
	roomUnread,
	setRoomUnread,
}) {
	const handleAsideTouchStart = (e) => {
		// swipe handling would be passed from parent, but we keep it here for simplicity
		const t = e.touches[0];
		window.__swipeStart = { x: t.clientX, y: t.clientY };
	};

	const handleAsideTouchEnd = (e) => {
		if (!window.__swipeStart) return;
		const t = e.changedTouches[0];
		const dx = window.__swipeStart.x - t.clientX;
		const dy = Math.abs(t.clientY - window.__swipeStart.y);
		if (dx > 60 && dy < 80) {
			onClose?.();
		}
		delete window.__swipeStart;
	};

	return (
		<>
			<div
				className={`
          fixed inset-0 z-40 touch-none md:hidden
          bg-black/20 backdrop-blur-[1px]
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
				onClick={onClose}
				aria-hidden='true'
				onTouchStart={(e) => e.stopPropagation()}
			/>

			<aside
				className={`
          fixed inset-y-0 left-0 z-50
          w-[240px] flex flex-col shrink-0
          bg-[var(--bg-surface)] border-r border-[var(--border)]
          transition-transform duration-300 ease-out
          md:static md:z-auto md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
				aria-label='Navigation'
				role='dialog'
				aria-modal={isOpen}
				onTouchStart={handleAsideTouchStart}
				onTouchEnd={handleAsideTouchEnd}
			>
				<div className='flex items-center justify-between px-3 pt-4 pb-3 shrink-0'>
					<div className='flex items-center gap-2'>
						<span className='flex items-baseline gap-0.5' aria-label='Mizuka'>
							<span
								className='text-[22px] font-semibold text-teal-400 leading-none tracking-[-1.5px]'
								aria-hidden='true'
							>
								M
							</span>
							<span
								className='text-[18px] font-light text-[var(--text-primary)] tracking-[-0.5px]'
								aria-hidden='true'
							>
								izuka
							</span>
						</span>
						<span className='w-1.5 h-1.5 rounded-full bg-teal-500 opacity-70' />
					</div>
					{onClose && (
						<button
							className={`${iconBtnCls} md:hidden`}
							onClick={onClose}
							aria-label='Close navigation'
						>
							<X size={16} strokeWidth={2} />
						</button>
					)}
				</div>

				<div className='px-2 mb-2 shrink-0'>
					<button
						className='w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--bg-hover)] text-left transition-colors hover:bg-[var(--border)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
						onClick={onOpenPanel}
						aria-label='Manage institutes'
						aria-haspopup='dialog'
					>
						<span
							className='w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0'
							style={
								activeInstitute
									? {
											background:
												'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
											color: 'rgba(255,255,255,0.9)',
										}
									: { color: 'var(--text-ghost)' }
							}
						>
							{activeInstitute ? (
								activeInstitute.label[0].toUpperCase()
							) : (
								<Building2 size={14} />
							)}
						</span>
						<div className='min-w-0 flex-1'>
							<div className='text-[12px] font-medium text-[var(--text-primary)] truncate'>
								{activeInstitute ? activeInstitute.label : 'No institute'}
							</div>
							<div className='text-[10px] text-[var(--text-ghost)]'>
								click to manage
							</div>
						</div>
						<ChevronDown
							size={12}
							strokeWidth={2}
							className='text-[var(--text-ghost)] shrink-0'
						/>
					</button>
				</div>

				<div className='flex px-2 border-b border-[var(--border)] shrink-0'>
					{tabs.map(({ key, Icon, label }) => (
						<button
							key={key}
							className={`relative flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] ${
								activeTab === key
									? 'text-[var(--text-secondary)]'
									: 'text-[var(--text-ghost)] hover:text-[var(--text-muted)]'
							}`}
							onClick={() => onTabChange(key)}
						>
							<Icon size={12} strokeWidth={2} />
							{label}
							{key === 'inbox' && unreadCount > 0 && (
								<span className='flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[var(--teal-600)] text-white text-[9px] font-semibold'>
									{unreadCount > 99 ? '99+' : unreadCount}
								</span>
							)}
							{activeTab === key && (
								<span className='absolute bottom-[-1px] left-0 right-0 h-px bg-[var(--teal-600)]' />
							)}
						</button>
					))}
				</div>

				<div className='flex-1 overflow-hidden flex flex-col pt-3'>
					{activeTab === 'channels' && (
						<div className='flex flex-col flex-1 overflow-hidden'>
							{channels.length > 0 ? (
								<>
									{/* Channels header */}
									<div className='flex items-center justify-between px-3 mb-1.5 shrink-0'>
										<span
											className='text-[11px] font-medium uppercase tracking-wide text-[var(--text-ghost)]'
											id='channels-label'
										>
											Channels
										</span>
										<div className='flex items-center gap-0.5'>
											<button
												className={iconBtnCls}
												onClick={onSearchToggle}
												aria-label='Search messages'
												aria-expanded={searchOpen}
											>
												<Search size={12} strokeWidth={2.5} />
											</button>
											{isAdmin && (
												<button
													className={iconBtnCls}
													onClick={onCreateChannel}
													aria-label='Create channel'
												>
													<Plus size={12} strokeWidth={2.5} />
												</button>
											)}
										</div>
									</div>

									{searchOpen && (
										<div className='mx-2 mb-2 shrink-0'>
											<div className='flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-2.5 py-1.5 focus-within:border-[var(--teal-700)]'>
												<Search
													size={12}
													className='text-[var(--text-ghost)] shrink-0'
												/>
												<input
													type='text'
													className='flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] text-[13px]'
													placeholder='Search messages…'
													value={searchTerm}
													onChange={(e) => onSearchChange(e.target.value)}
													onKeyDown={(e) =>
														e.key === 'Escape' && onSearchClear()
													}
												/>
												{searchTerm && (
													<button
														className={iconBtnCls}
														onClick={onSearchClear}
													>
														<X size={11} />
													</button>
												)}
											</div>
											{searchLoading && (
												<p className='text-[12px] text-[var(--text-ghost)] px-1 py-1.5'>
													Searching…
												</p>
											)}
											{!searchLoading &&
												searchTerm.length >= 2 &&
												searchResults.length === 0 && (
													<p className='text-[12px] text-[var(--text-ghost)] px-1 py-1.5'>
														No results found
													</p>
												)}
											{searchResults.length > 0 && (
												<ul className='mt-1 flex flex-col gap-0.5'>
													{searchResults.map((result) => {
														const ch = channels.find(
															(c) => String(c.id) === String(result.channel_id),
														);
														return (
															<li key={result.id}>
																<button
																	className='w-full flex flex-col gap-0.5 px-2.5 py-2 rounded-md text-left hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
																	onClick={() => onSearchResultClick(result)}
																>
																	{ch && (
																		<span className='flex items-center gap-1 text-[10px] text-[var(--text-ghost)]'>
																			<Hash size={9} strokeWidth={2.5} />
																			{ch.name}
																		</span>
																	)}
																	<span className='text-[12px] text-[var(--text-muted)] leading-snug line-clamp-2'>
																		{result.content?.length > 80
																			? result.content.slice(0, 80) + '…'
																			: result.content}
																	</span>
																	{result.username && (
																		<span className='text-[10px] text-[var(--text-ghost)]'>
																			{result.username}
																		</span>
																	)}
																</button>
															</li>
														);
													})}
												</ul>
											)}
										</div>
									)}

									<ul
										className='flex-1 overflow-y-auto px-1 flex flex-col gap-0.5'
										aria-labelledby='channels-label'
										role='list'
									>
										{channels.map((ch) => (
											<li key={ch.id} role='listitem'>
												<button
													className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] ${
														activeChannel === ch.id
															? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
															: 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]'
													}`}
													onClick={() => onChannelSelect(ch)}
													aria-current={
														activeChannel === ch.id ? 'page' : undefined
													}
												>
													<Hash
														size={13}
														strokeWidth={2}
														className='shrink-0'
													/>
													<span className='truncate'>{ch.name}</span>
												</button>
											</li>
										))}
									</ul>
								</>
							) : (
								<div className='flex flex-col items-center justify-center gap-3 flex-1 px-4 text-center'>
									<Building2
										size={28}
										strokeWidth={1}
										className='text-[var(--text-ghost)]'
									/>
									<p className='text-[12px] text-[var(--text-ghost)] leading-relaxed'>
										Select or join an institute to see channels.
									</p>
								</div>
							)}
						</div>
					)}

					{activeTab === 'inbox' && activeInstitute && (
						<Inbox
							activeInstitute={activeInstitute}
							currentUser={user}
							onStartP2P={onStartP2P}
							onlineUsers={onlineUsers}
							activeP2P={activeP2P}
							onUnreadUpdate={onUnreadUpdate}
							onJumpToP2PMessage={onJumpToP2PMessage}
							recentChats={recentChats}
							setRecentChats={setRecentChats}
							roomUnread={roomUnread}
							setRoomUnread={setRoomUnread}
						/>
					)}

					{activeTab === 'inbox' && !activeInstitute && (
						<div className='flex flex-col items-center justify-center gap-3 flex-1 px-4 text-center'>
							<Building2
								size={28}
								strokeWidth={1}
								className='text-[var(--text-ghost)]'
							/>
							<p className='text-[12px] text-[var(--text-ghost)] leading-relaxed'>
								Select an institute to search members
							</p>
						</div>
					)}
				</div>

				<div className='border-t border-[var(--border)] px-2 py-2 shrink-0'>
					<div className='flex items-center gap-1'>
						<div
							className='flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={onOpenProfile}
							role='button'
							tabIndex={0}
							onKeyDown={(e) =>
								(e.key === 'Enter' || e.key === ' ') && onOpenProfile()
							}
						>
							{user.profile_picture ? (
								<img
									src={user.profile_picture}
									alt={user.username}
									className='w-7 h-7 rounded-full object-cover shrink-0'
								/>
							) : (
								<div
									className='w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0'
									style={{
										background:
											'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
									}}
								>
									{user.username[0].toUpperCase()}
								</div>
							)}
							<div className='min-w-0'>
								<div className='text-[12px] font-medium text-[var(--text-primary)] truncate'>
									{user.username}
								</div>
								<div className='text-[10px] text-[var(--text-ghost)] capitalize'>
									{user.role || 'member'}
								</div>
							</div>
						</div>
						<button
							className={iconBtnCls}
							onClick={onToggleTheme}
							aria-label={
								theme === 'dark'
									? 'Switch to light mode'
									: 'Switch to dark mode'
							}
							title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
						>
							{theme === 'dark' ? (
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
								>
									<circle cx='12' cy='12' r='5' />
									<line x1='12' y1='1' x2='12' y2='3' />
									<line x1='12' y1='21' x2='12' y2='23' />
									<line x1='4.22' y1='4.22' x2='5.64' y2='5.64' />
									<line x1='18.36' y1='18.36' x2='19.78' y2='19.78' />
									<line x1='1' y1='12' x2='3' y2='12' />
									<line x1='21' y1='12' x2='23' y2='12' />
									<line x1='4.22' y1='19.78' x2='5.64' y2='18.36' />
									<line x1='18.36' y1='5.64' x2='19.78' y2='4.22' />
								</svg>
							) : (
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
								>
									<path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
								</svg>
							)}
						</button>
						<button
							className={iconBtnCls}
							onClick={onLogout}
							aria-label='Sign out'
							title='Sign out'
						>
							<LogOut size={14} strokeWidth={2} />
						</button>
					</div>
				</div>
			</aside>

			{panelOpen && (
				<InstituteSidebar onClose={onClosePanel} onStartP2P={onStartP2P} />
			)}
			{createModalOpen && (
				<CreateChannelModal
					onClose={onCloseCreate}
					onConfirm={handleCreateChannel}
				/>
			)}
			{isProfileOpen && (
				<UserProfilePanel userId={user.id} onClose={onCloseProfile} />
			)}
		</>
	);
}
