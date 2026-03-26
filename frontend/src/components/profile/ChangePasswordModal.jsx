import { useState, useRef, useEffect } from 'react';
import { X, Loader, ShieldCheck } from 'lucide-react';
import { changePassword } from '../../services/api';

const labelCls = 'text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)]';
const inputCls = 'w-full py-[9px] pl-3 pr-10 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm font-[inherit] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-ghost)] focus:border-[var(--teal-600)] focus:shadow-[0_0_0_2px_rgba(20,184,166,0.07)] disabled:opacity-50 disabled:cursor-not-allowed';
const eyeCls = 'absolute right-2.5 flex items-center justify-center w-6 h-6 rounded-[5px] text-[var(--text-ghost)] transition-colors duration-150 hover:text-[var(--text-muted)]';

function EyeIcon({ open }) {
	return open ? (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
			<line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	) : (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

function PasswordField({ label, value, show, onToggle, onChange, onKeyDown, disabled, autoComplete, inputRef }) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className={labelCls}>{label}</label>
			<div className="relative flex items-center">
				<input
					ref={inputRef}
					type={show ? 'text' : 'password'}
					className={inputCls}
					value={value}
					onChange={onChange}
					onKeyDown={onKeyDown}
					disabled={disabled}
					autoComplete={autoComplete}
				/>
				<button
					className={eyeCls}
					onClick={onToggle}
					tabIndex={-1}
					type="button"
					aria-label={show ? 'Hide password' : 'Show password'}
				>
					<EyeIcon open={show} />
				</button>
			</div>
		</div>
	);
}

function ChangePasswordModal({ userId, onClose }) {
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showOld, setShowOld] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const oldRef = useRef(null);

	useEffect(() => { oldRef.current?.focus(); }, []);

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) onClose();
	}

	async function handleSubmit() {
		setError('');
		if (!oldPassword || !newPassword || !confirmPassword) { setError('All fields are required'); return; }
		if (newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
		if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
		if (oldPassword === newPassword) { setError('New password must be different from current password'); return; }
		setLoading(true);
		const res = await changePassword(userId, oldPassword, newPassword);
		setLoading(false);
		if (res?.message === 'Password updated successfully') {
			setSuccess(true);
			setTimeout(() => onClose(), 1800);
		} else {
			setError(res?.message || 'Failed to update password');
		}
	}

	function handleKeyDown(e) {
		if (e.key === 'Enter') handleSubmit();
		if (e.key === 'Escape') onClose();
	}

	const clear = () => setError('');

	return (
		<div
			className="fixed inset-0 bg-black/55 backdrop-blur-[3px] z-[3000] flex items-center justify-center p-5 animate-[cpw-fade-in_0.18s_ease-out]"
			onClick={handleOverlayClick}
		>
			<div
				className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-[400px] shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden animate-[cpw-slide-up_0.22s_cubic-bezier(0.16,1,0.3,1)]"
				role="dialog"
				aria-modal="true"
				aria-labelledby="cpw-title"
			>
				<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
					<div className="flex items-center gap-2">
						<ShieldCheck size={18} className="text-[var(--teal-600)] shrink-0" aria-hidden="true" />
						<span className="text-sm font-medium text-[var(--text-primary)]" id="cpw-title">
							Change Password
						</span>
					</div>
					<button
						className="w-[30px] h-[30px] flex items-center justify-center rounded-[7px] text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
						onClick={onClose}
						aria-label="Close"
					>
						<X size={17} strokeWidth={2} />
					</button>
				</div>

				{success ? (
					<div className="flex flex-col items-center justify-center gap-3 py-10 px-5">
						<ShieldCheck size={36} className="text-[var(--teal-500)]" aria-hidden="true" />
						<p className="text-sm font-medium text-[var(--text-secondary)]">
							Password updated successfully
						</p>
					</div>
				) : (
					<div className="px-5 py-5 flex flex-col gap-4">
						<PasswordField
							label="Current Password"
							value={oldPassword}
							show={showOld}
							onToggle={() => setShowOld((v) => !v)}
							onChange={(e) => { setOldPassword(e.target.value); clear(); }}
							onKeyDown={handleKeyDown}
							disabled={loading}
							autoComplete="current-password"
							inputRef={oldRef}
						/>
						<PasswordField
							label="New Password"
							value={newPassword}
							show={showNew}
							onToggle={() => setShowNew((v) => !v)}
							onChange={(e) => { setNewPassword(e.target.value); clear(); }}
							onKeyDown={handleKeyDown}
							disabled={loading}
							autoComplete="new-password"
						/>
						<PasswordField
							label="Confirm New Password"
							value={confirmPassword}
							show={showConfirm}
							onToggle={() => setShowConfirm((v) => !v)}
							onChange={(e) => { setConfirmPassword(e.target.value); clear(); }}
							onKeyDown={handleKeyDown}
							disabled={loading}
							autoComplete="new-password"
						/>

						{error && (
							<p
								className="text-[12px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-[7px] px-3 py-2"
								role="alert"
							>
								{error}
							</p>
						)}

						<div className="flex gap-2 justify-end pt-1">
							<button
								className="px-[18px] py-2 rounded-lg bg-[var(--bg-hover)] text-[var(--text-muted)] text-[13px] font-medium transition-[background,color] duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--border)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
								onClick={onClose}
								disabled={loading}
								type="button"
							>
								Cancel
							</button>
							<button
								className="min-w-[130px] flex items-center justify-center gap-1.5 px-[18px] py-2 rounded-lg bg-[var(--teal-600)] text-white text-[13px] font-medium transition-[background,opacity] duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--teal-700)] focus-visible:outline-2 focus-visible:outline-[var(--teal-600)]"
								onClick={handleSubmit}
								disabled={loading}
								type="button"
							>
								{loading ? <Loader size={14} className="animate-spin-fast shrink-0" /> : 'Update Password'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default ChangePasswordModal;