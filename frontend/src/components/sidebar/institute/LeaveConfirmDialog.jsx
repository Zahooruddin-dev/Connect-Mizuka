export default function LeaveConfirmDialog({ target, onConfirm, onCancel }) {
	return (
		<div
			className='absolute inset-0 flex items-center justify-center p-4 bg-black/20'
			role='alertdialog'
			aria-modal='true'
			aria-label='Confirm leaving institute'
		>
			<div className='w-full max-w-[320px] bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-2xl shadow-lg p-6 flex flex-col gap-3 animate-[modal-pop_0.2s_cubic-bezier(0.16,1,0.3,1)]'>
				<p className='text-sm font-medium text-[var(--text-primary)]'>
					Leave institute?
				</p>
				<p className='text-[13px] text-[var(--text-muted)] leading-relaxed'>
					You'll be removed from{' '}
					<strong className='text-[var(--text-primary)]'>
						{target.label}
					</strong>{' '}
					and won't see its channels until you rejoin.
				</p>
				<div className='flex gap-2 mt-1'>
					<button
						className='flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-medium rounded-lg transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-red-400'
						onClick={onConfirm}
					>
						Leave
					</button>
					<button
						className='flex-1 px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] text-[13px] font-medium rounded-lg transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
						onClick={onCancel}
					>
						Keep it
					</button>
				</div>
			</div>
		</div>
	);
}