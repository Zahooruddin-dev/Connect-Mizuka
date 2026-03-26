import { Users, ChevronDown } from 'lucide-react';
import MemberRow from './MemberRow';

export default function MembersSection({
	members,
	membersOpen,
	membersLoading,
	onOpenChange,
	onMemberSelect,
	currentUserId,
}) {
	const adminCount = members.filter((m) => m.role === 'admin').length;
	const memberCount = members.length;

	return (
		<div>
			<button
				className='flex items-center justify-between w-full px-2 py-2 rounded-lg text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
				onClick={() => onOpenChange((v) => !v)}
				aria-expanded={membersOpen}
			>
				<div className='flex items-center gap-2'>
					<Users size={13} strokeWidth={2} aria-hidden='true' />
					<span>Members</span>
					{memberCount > 0 && (
						<span className='px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[10px] text-[var(--text-ghost)]'>
							{memberCount}
						</span>
					)}
				</div>
				<ChevronDown
					size={13}
					strokeWidth={2}
					className={`text-[var(--text-ghost)] transition-transform duration-200 ${membersOpen ? 'rotate-180' : ''}`}
					aria-hidden='true'
				/>
			</button>

			{membersOpen && (
				<div className='mt-1 flex flex-col'>
					{membersLoading && members.length === 0 ? (
						<div className='flex items-center gap-1.5 px-3 py-3'>
							{[0, 150, 300].map((delay) => (
								<span
									key={delay}
									className='w-1.5 h-1.5 rounded-full bg-[var(--teal-800)] animate-[bounce-dot_1.2s_ease-in-out_infinite]'
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
					) : members.length === 0 ? (
						<p className='text-[12px] text-[var(--text-ghost)] px-3 py-2'>
							No members found
						</p>
					) : (
						<>
							{adminCount > 0 && (
								<p className='text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)] px-3 py-1.5'>
									Admins
								</p>
							)}
							{members
								.filter((m) => m.role === 'admin')
								.map((m) => (
									<MemberRow
										key={m.id}
										member={m}
										isYou={m.id === currentUserId}
										onClick={() => onMemberSelect(m.id)}
									/>
								))}
							{members.filter((m) => m.role !== 'admin').length > 0 && (
								<p className='text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)] px-3 py-1.5 mt-1'>
									Members
								</p>
							)}
							{members
								.filter((m) => m.role !== 'admin')
								.map((m) => (
									<MemberRow
										key={m.id}
										member={m}
										isYou={m.id === currentUserId}
										onClick={() => onMemberSelect(m.id)}
									/>
								))}
						</>
					)}
				</div>
			)}
		</div>
	);
}