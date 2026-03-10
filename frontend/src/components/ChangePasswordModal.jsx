import { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, Loader, ShieldCheck } from 'lucide-react';
import { changePassword } from '../services/api';
import './styles/ChangePasswordModal.css';

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

	useEffect(() => {
		oldRef.current?.focus();
	}, []);

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) onClose();
	}

	async function handleSubmit() {
		setError('');

		if (!oldPassword || !newPassword || !confirmPassword) {
			setError('All fields are required');
			return;
		}

		if (newPassword.length < 6) {
			setError('New password must be at least 6 characters');
			return;
		}

		if (newPassword !== confirmPassword) {
			setError('New passwords do not match');
			return;
		}

		if (oldPassword === newPassword) {
			setError('New password must be different from current password');
			return;
		}

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

	return (
		<div className='cpw-overlay' onClick={handleOverlayClick}>
			<div className='cpw-modal' role='dialog' aria-modal='true' aria-labelledby='cpw-title'>
				<div className='cpw-header'>
					<div className='cpw-header-left'>
						<ShieldCheck size={18} className='cpw-header-icon' />
						<span className='cpw-title' id='cpw-title'>Change Password</span>
					</div>
					<button className='cpw-close' onClick={onClose} aria-label='Close'>
						<X size={17} strokeWidth={2} />
					</button>
				</div>

				{success ? (
					<div className='cpw-success-state'>
						<ShieldCheck size={36} className='cpw-success-icon' />
						<p className='cpw-success-text'>Password updated successfully</p>
					</div>
				) : (
					<div className='cpw-body'>
						<div className='cpw-field'>
							<label className='cpw-label'>Current Password</label>
							<div className='cpw-input-wrap'>
								<input
									ref={oldRef}
									type={showOld ? 'text' : 'password'}
									className='cpw-input'
									value={oldPassword}
									onChange={(e) => { setOldPassword(e.target.value); setError(''); }}
									onKeyDown={handleKeyDown}
									placeholder='Enter current password'
									disabled={loading}
									autoComplete='current-password'
								/>
								<button
									className='cpw-eye'
									onClick={() => setShowOld((v) => !v)}
									tabIndex={-1}
									type='button'
									aria-label={showOld ? 'Hide password' : 'Show password'}
								>
									{showOld ? <EyeOff size={15} /> : <Eye size={15} />}
								</button>
							</div>
						</div>

						<div className='cpw-field'>
							<label className='cpw-label'>New Password</label>
							<div className='cpw-input-wrap'>
								<input
									type={showNew ? 'text' : 'password'}
									className='cpw-input'
									value={newPassword}
									onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
									onKeyDown={handleKeyDown}
									placeholder='Enter new password'
									disabled={loading}
									autoComplete='new-password'
								/>
								<button
									className='cpw-eye'
									onClick={() => setShowNew((v) => !v)}
									tabIndex={-1}
									type='button'
									aria-label={showNew ? 'Hide password' : 'Show password'}
								>
									{showNew ? <EyeOff size={15} /> : <Eye size={15} />}
								</button>
							</div>
						</div>

						<div className='cpw-field'>
							<label className='cpw-label'>Confirm New Password</label>
							<div className='cpw-input-wrap'>
								<input
									type={showConfirm ? 'text' : 'password'}
									className='cpw-input'
									value={confirmPassword}
									onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
									onKeyDown={handleKeyDown}
									placeholder='Confirm new password'
									disabled={loading}
									autoComplete='new-password'
								/>
								<button
									className='cpw-eye'
									onClick={() => setShowConfirm((v) => !v)}
									tabIndex={-1}
									type='button'
									aria-label={showConfirm ? 'Hide password' : 'Show password'}
								>
									{showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
								</button>
							</div>
						</div>

						{error && <p className='cpw-error'>{error}</p>}

						<div className='cpw-actions'>
							<button className='cpw-btn cpw-btn-cancel' onClick={onClose} disabled={loading}>
								Cancel
							</button>
							<button className='cpw-btn cpw-btn-submit' onClick={handleSubmit} disabled={loading}>
								{loading ? <Loader size={14} className='cpw-spinner' /> : 'Update Password'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default ChangePasswordModal;