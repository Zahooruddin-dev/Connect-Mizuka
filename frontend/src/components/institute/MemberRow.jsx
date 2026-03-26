export default function MemberRow({ member, isYou, onClick }) {
	return (
		<button
			className='w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-[background] duration-150 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
			onClick={onClick}
			title={`View ${member.username}'s profile`}
		>
			<div
				className='w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0'
				style={{
					background:
						'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
				}}
				aria-hidden='true'
			>
				{member.username?.[0]?.toUpperCase() || 'U'}
			</div>
			<div className='flex-1 min-w-0'>
				<div className='flex items-center gap-1.5'>
					<span className='text-[13px] text-[var(--text-secondary)] truncate'>
						{member.username}
					</span>
					{isYou && (
						<span className='px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[10px] text-[var(--text-ghost)]'>
							you
						</span>
					)}
				</div>
				{member.email && (
					<span className='block text-[11px] text-[var(--text-ghost)] truncate'>
						{member.email}
					</span>
				)}
			</div>
			<span
				className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${member.role === 'admin' ? 'bg-teal-500/[0.1] text-teal-600' : 'bg-[var(--bg-hover)] text-[var(--text-ghost)]'}`}
			>
				{member.role || 'member'}
			</span>
		</button>
	);
}