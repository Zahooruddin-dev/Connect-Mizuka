import { Copy, LogOut, Check, Building2 } from 'lucide-react';

const iconBtnCls =
	'flex items-center justify-center w-7 h-7 rounded-lg transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

export default function InstitutesList({
	institutes,
	activeInstitute,
	copiedId,
	onSelect,
	onCopyId,
	onLeave,
}) {
	if (institutes.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center gap-3 py-8'>
				<Building2
					size={36}
					strokeWidth={1}
					className='text-[var(--text-ghost)]'
					aria-hidden='true'
				/>
				<p className='text-[13px] text-[var(--text-muted)] text-center'>
					You haven't joined any institutes yet.
				</p>
			</div>
		);
	}

	return (
		<ul
			className='flex flex-col gap-1'
			role='listbox'
			aria-label='Your institutes'
		>
			{institutes.map((inst) => (
				<li key={inst.id} className='flex items-center gap-1'>
					<button
						className={`flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-[background,border-color] duration-150 border focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] ${activeInstitute?.id === inst.id ? 'bg-teal-500/[0.06] border-teal-500/[0.15]' : 'border-transparent hover:bg-[var(--bg-hover)]'}`}
						onClick={() => onSelect(inst)}
						role='option'
						aria-selected={activeInstitute?.id === inst.id}
					>
						<span
							className='w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0'
							style={{
								background:
									'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
							}}
							aria-hidden='true'
						>
							{inst.label[0].toUpperCase()}
						</span>
						<span className='min-w-0 flex-1'>
							<span className='block text-[13px] font-medium text-[var(--text-primary)] truncate'>
								{inst.label}
							</span>
							{inst.label !== inst.id && (
								<span
									className='block text-[11px] text-[var(--text-ghost)] font-mono truncate cursor-pointer hover:text-[var(--text-muted)] transition-colors'
									onClick={(e) => {
										e.stopPropagation();
										onCopyId(inst.id);
									}}
									role='button'
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.stopPropagation();
											onCopyId(inst.id);
										}
									}}
								>
									{inst.id}
								</span>
							)}
						</span>
						{activeInstitute?.id === inst.id && (
							<span
								className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/[0.12] text-teal-600 text-[10px] font-medium shrink-0'
								aria-hidden='true'
							>
								<Check size={9} strokeWidth={3} />
								active
							</span>
						)}
					</button>

					<button
						className={`${iconBtnCls} shrink-0 ${copiedId === inst.id ? 'bg-teal-500/[0.1] text-teal-500' : 'text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]'}`}
						onClick={() => onCopyId(inst.id)}
						aria-label={`Copy ID for ${inst.label}`}
						title='Copy institute ID'
					>
						{copiedId === inst.id ? (
							<Check size={12} strokeWidth={3} aria-hidden='true' />
						) : (
							<Copy size={12} strokeWidth={2} aria-hidden='true' />
						)}
					</button>

					<button
						className={`${iconBtnCls} shrink-0 text-[var(--text-ghost)] hover:bg-red-400/[0.06] hover:text-red-400`}
						onClick={() => onLeave(inst)}
						aria-label={`Leave ${inst.label}`}
						title='Leave institute'
					>
						<LogOut size={13} strokeWidth={2} aria-hidden='true' />
					</button>
				</li>
			))}
		</ul>
	);
}