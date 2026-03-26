import { X, Building2 } from 'lucide-react';

const iconBtnCls =
	'flex items-center justify-center w-7 h-7 rounded-lg transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

export default function SidebarHeader({ onClose, firstFocusRef }) {
	return (
		<div className='flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0'>
			<div className='flex items-center gap-2'>
				<Building2
					size={15}
					strokeWidth={1.5}
					className='text-[var(--text-muted)] shrink-0'
					aria-hidden='true'
				/>
				<h2 className='text-sm font-medium text-[var(--text-primary)]'>
					Institutes
				</h2>
			</div>
			<button
				ref={firstFocusRef}
				className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]`}
				onClick={onClose}
				aria-label='Close panel'
			>
				<X size={16} strokeWidth={2} />
			</button>
		</div>
	);
}