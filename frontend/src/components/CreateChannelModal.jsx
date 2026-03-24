import { useState, useEffect, useRef } from 'react';
import { X, Hash, Loader } from 'lucide-react';

const iconBtnCls =
	'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

export default function CreateChannelModal({ onClose, onConfirm }) {
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const inputRef = useRef(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onClose]);

	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) onClose();
	}

	function sanitize(val) {
		return val
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-_]/g, '');
	}

	function handleChange(e) {
		setName(sanitize(e.target.value));
		setError('');
	}

	async function handleSubmit(e) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setError('Channel name is required');
			return;
		}
		if (trimmed.length < 2) {
			setError('Name must be at least 2 characters');
			return;
		}
		setLoading(true);
		const result = await onConfirm(trimmed);
		setLoading(false);
		if (result?.error) {
			setError(result.error);
		} else {
			onClose();
		}
	}

	return (
		<>
			<style>{`
        @keyframes overlay-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

			<div
				className='fixed inset-0 bg-black/50 backdrop-blur-[3px] z-[2000] flex items-center justify-center p-4 animate-[overlay-fade-in_0.2s_ease-out]'
				onClick={handleBackdropClick}
				role='dialog'
				aria-modal='true'
				aria-labelledby='ccm-title'
			>
				<div className='w-full max-w-[400px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.32)] overflow-hidden animate-[modal-pop_0.2s_cubic-bezier(0.16,1,0.3,1)]'>
					<div className='flex items-center justify-between px-5 pt-5'>
						<h2
							id='ccm-title'
							className='text-sm font-medium text-[var(--text-primary)]'
						>
							Create a channel
						</h2>
						<button
							className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]`}
							onClick={onClose}
							aria-label='Close'
						>
							<X size={16} strokeWidth={2} />
						</button>
					</div>

					<p className='text-[13px] text-[var(--text-muted)] leading-relaxed px-5 pt-2.5'>
						Channels are where your team communicates. Give it a short, clear
						name.
					</p>

					<form
						className='px-5 pt-4 pb-5 flex flex-col'
						onSubmit={handleSubmit}
						noValidate
					>
						<label
							className='block text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5'
							htmlFor='ccm-name'
						>
							Channel name
						</label>
						<div className='relative flex items-center'>
							<Hash
								size={14}
								strokeWidth={2}
								className='absolute left-3 text-[var(--text-ghost)] pointer-events-none shrink-0'
								aria-hidden='true'
							/>
							<input
								id='ccm-name'
								ref={inputRef}
								className='w-full py-2.5 pl-8 pr-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-sm font-mono outline-none transition-[border-color] duration-150 placeholder:text-[var(--text-ghost)] focus:border-[var(--teal-600)] disabled:opacity-50'
								type='text'
								value={name}
								onChange={handleChange}
								placeholder='e.g. announcements'
								autoComplete='off'
								spellCheck={false}
								maxLength={64}
								disabled={loading}
							/>
						</div>

						{error && (
							<p
								className='text-[12px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-md px-2.5 py-1.5 mt-2'
								role='alert'
							>
								{error}
							</p>
						)}

						<p className='text-[11px] text-[var(--text-ghost)] mt-1.5 leading-relaxed'>
							Lowercase letters, numbers, hyphens and underscores only.
						</p>

						<div className='flex gap-2 justify-end mt-5'>
							<button
								type='button'
								className='px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-muted)] text-[13px] font-medium rounded-md transition-colors disabled:opacity-50 hover:bg-[var(--border)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
								onClick={onClose}
								disabled={loading}
							>
								Cancel
							</button>
							<button
								type='submit'
								className='flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium rounded-md transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--teal-600)]'
								disabled={loading || !name.trim()}
							>
								{loading ? (
									<>
										<Loader size={13} className='animate-spin-fast shrink-0' />
										Creating…
									</>
								) : (
									'Create channel'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
