import { useState, useEffect, useRef } from 'react';
import { X, Hash, Loader } from 'lucide-react';

export default function CreateChannelModal({ onClose, onConfirm }) {
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const inputRef = useRef(null);

	useEffect(() => { inputRef.current?.focus(); }, []);

	useEffect(() => {
		const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onClose]);

	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) onClose();
	}

	function sanitize(val) {
		return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
	}

	function handleChange(e) {
		setName(sanitize(e.target.value));
		setError('');
	}

	async function handleSubmit(e) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) { setError('Channel name is required'); return; }
		if (trimmed.length < 2) { setError('Name must be at least 2 characters'); return; }
		setLoading(true);
		const result = await onConfirm(trimmed);
		setLoading(false);
		if (result?.error) { setError(result.error); } else { onClose(); }
	}

	return (
		<div
			className="fixed inset-0 bg-[rgba(5,12,10,0.55)] backdrop-blur-[2px] z-[1500] flex items-center justify-center p-4 animate-[ccm-backdrop-in_0.15s_ease]"
			onClick={handleBackdropClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby="ccm-title"
		>
			<div className="w-full max-w-[400px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[14px] shadow-[0_16px_48px_rgba(0,0,0,0.38)] overflow-hidden animate-[ccm-card-in_0.2s_cubic-bezier(0.16,1,0.3,1)]">
				<div className="flex items-center justify-between px-5 pt-5">
					<h2 className="text-sm font-medium text-[var(--text-primary)] tracking-[-0.2px]" id="ccm-title">
						Create a channel
					</h2>
					<button
						className="w-[30px] h-[30px] flex items-center justify-center rounded-lg text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:outline-offset-[1px]"
						onClick={onClose}
						aria-label="Close"
					>
						<X size={16} strokeWidth={2} />
					</button>
				</div>

				<p className="text-[13px] text-[var(--text-muted)] leading-[1.6] px-5 pt-2.5">
					Channels are where your team communicates. Give it a short, clear name.
				</p>

				<form className="px-5 pt-4 pb-5 flex flex-col" onSubmit={handleSubmit} noValidate>
					<label
						className="block text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-[7px]"
						htmlFor="ccm-name"
					>
						Channel name
					</label>
					<div className="relative flex items-center">
						<Hash
							size={14}
							strokeWidth={2}
							className="absolute left-[11px] text-[var(--text-ghost)] pointer-events-none shrink-0"
							aria-hidden="true"
						/>
						<input
							id="ccm-name"
							ref={inputRef}
							className="w-full py-2.5 pl-8 pr-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-[9px] text-[var(--text-primary)] text-sm font-mono outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--text-ghost)] placeholder:font-mono focus:border-[var(--teal-600)] focus:shadow-[0_0_0_2px_rgba(20,184,166,0.07)] disabled:opacity-50 disabled:cursor-not-allowed"
							type="text"
							value={name}
							onChange={handleChange}
							placeholder="e.g. announcements"
							autoComplete="off"
							spellCheck={false}
							maxLength={64}
							disabled={loading}
						/>
					</div>

					{error && (
						<p
							className="text-[12px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-[7px] px-2.5 py-[7px] mt-2 leading-[1.4]"
							role="alert"
						>
							{error}
						</p>
					)}

					<p className="text-[11px] text-[var(--text-ghost)] mt-[7px] leading-[1.5]">
						Lowercase letters, numbers, hyphens and underscores only.
					</p>

					<div className="flex gap-2 justify-end mt-5">
						<button
							type="button"
							className="px-4 py-[9px] bg-[var(--bg-hover)] text-[var(--text-muted)] text-[13px] font-medium rounded-lg transition-[background,color] duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--border)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:outline-offset-2"
							onClick={onClose}
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex items-center gap-1.5 px-[18px] py-[9px] bg-[var(--teal-600)] text-white text-[13px] font-medium rounded-lg transition-[background,opacity] duration-150 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[var(--teal-700)] focus-visible:outline-2 focus-visible:outline-[var(--teal-600)] focus-visible:outline-offset-2"
							disabled={loading || !name.trim()}
						>
							{loading
								? <><Loader size={13} className="animate-spin-fast shrink-0" /> Creating…</>
								: 'Create channel'
							}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
