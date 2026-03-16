import { useState, useEffect, useRef } from 'react';
import { X, Pencil, Check, Loader, Camera } from 'lucide-react';
import { fetchUserInfo, updateProfile } from '../services/api';
import ChangePasswordModal from './ChangePasswordModal';
import './styles/UserProfilePanel.css';

function UserProfilePanel({ userId, onClose, onUsernameChanged }) {
	const [userInfo, setUserInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('profile');
	const [editingUsername, setEditingUsername] = useState(false);
	const [usernameInput, setUsernameInput] = useState('');
	const [saveLoading, setSaveLoading] = useState(false);
	const [saveError, setSaveError] = useState('');
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState(null);
	const [avatarFile, setAvatarFile] = useState(null);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [avatarError, setAvatarError] = useState('');

	const inputRef = useRef(null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			try {
				const data = await fetchUserInfo(userId);
				if (isMounted) setUserInfo(data.user);
			} catch {
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		load();
		return () => {
			isMounted = false;
		};
	}, [userId]);

	useEffect(() => {
		if (editingUsername) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [editingUsername]);

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) onClose();
	}

	function startEditUsername() {
		setUsernameInput(userInfo.username || '');
		setSaveError('');
		setSaveSuccess(false);
		setEditingUsername(true);
	}

	function cancelEditUsername() {
		setEditingUsername(false);
		setSaveError('');
		setUsernameInput('');
	}

	async function saveUsername() {
		const trimmed = usernameInput.trim();
		if (!trimmed) {
			setSaveError('Username cannot be empty');
			return;
		}
		if (trimmed === userInfo.username) {
			setEditingUsername(false);
			return;
		}

		setSaveLoading(true);
		setSaveError('');
		const res = await updateProfile({ username: trimmed });
		setSaveLoading(false);

		if (res?.user) {
			setUserInfo((prev) => ({ ...prev, username: res.user.username }));
			setEditingUsername(false);
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 3000);
			if (typeof onUsernameChanged === 'function')
				onUsernameChanged(res.user.username);
		} else {
			setSaveError(res?.message || 'Failed to update username');
		}
	}

	function handleKeyDown(e) {
		if (e.key === 'Enter') saveUsername();
		if (e.key === 'Escape') cancelEditUsername();
	}

	function handleAvatarFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarFile(file);
		setAvatarPreview(URL.createObjectURL(file));
		setAvatarError('');
	}

	async function uploadAvatar() {
		if (!avatarFile) return;
		setAvatarUploading(true);
		setAvatarError('');

		const res = await updateProfile({ profilePicture: avatarFile });
		setAvatarUploading(false);

		if (res?.user) {
			setUserInfo((prev) => ({
				...prev,
				profile_picture: res.user.profile_picture,
			}));
			setAvatarFile(null);
			setAvatarPreview(null);
		} else {
			setAvatarError(res?.message || 'Failed to upload picture');
		}
	}

	function cancelAvatarPreview() {
		setAvatarFile(null);
		setAvatarPreview(null);
		setAvatarError('');
		if (fileInputRef.current) fileInputRef.current.value = '';
	}

	const displayAvatar = avatarPreview || userInfo?.profile_picture || null;

	const formattedDate = userInfo?.created_at
		? new Date(userInfo.created_at).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		: null;

	return (
		<>
			<div className='user-panel-overlay' onClick={handleOverlayClick}>
				<div
					className='user-panel'
					role='dialog'
					aria-modal='true'
					aria-labelledby='user-panel-title'
				>
					<div className='user-panel-header'>
						<span className='user-panel-title' id='user-panel-title'>
							User Profile
						</span>
						<button
							className='user-panel-close'
							onClick={onClose}
							aria-label='Close panel'
						>
							<X size={18} strokeWidth={2} />
						</button>
					</div>

					<div className='user-panel-tabs'>
						<button
							className={`user-panel-tab${activeTab === 'profile' ? ' active' : ''}`}
							onClick={() => setActiveTab('profile')}
						>
							Profile
						</button>
						<button
							className={`user-panel-tab${activeTab === 'account' ? ' active' : ''}`}
							onClick={() => setActiveTab('account')}
						>
							Account
						</button>
					</div>

					<div className='user-panel-body'>
						{loading ? (
							<div className='user-panel-loading'>
								<div className='sidebar-status' />
								<span>Loading user information…</span>
							</div>
						) : userInfo ? (
							<>
								{activeTab === 'profile' && (
									<>
										<div className='user-header-center'>
											<div className='user-avatar-large-wrap'>
												{displayAvatar ? (
													<img
														src={displayAvatar}
														alt={userInfo.username}
														className='user-avatar-large user-avatar-img'
													/>
												) : (
													<div className='user-avatar-large'>
														{userInfo.username
															? userInfo.username[0].toUpperCase()
															: 'U'}
													</div>
												)}
												<button
													className='user-avatar-edit-btn'
													onClick={() => fileInputRef.current?.click()}
													aria-label='Change profile picture'
													title='Change profile picture'
												>
													<Camera size={13} strokeWidth={2} />
												</button>
												<input
													ref={fileInputRef}
													type='file'
													accept='image/jpeg,image/png,image/webp,image/avif'
													className='user-avatar-file-input'
													onChange={handleAvatarFileChange}
													aria-label='Upload profile picture'
												/>
											</div>

											{avatarFile && (
												<div className='user-avatar-actions'>
													<button
														className='user-avatar-save-btn'
														onClick={uploadAvatar}
														disabled={avatarUploading}
													>
														{avatarUploading ? (
															<Loader size={12} className='user-edit-spinner' />
														) : (
															<Check size={12} strokeWidth={2.5} />
														)}
														{avatarUploading ? 'Uploading…' : 'Save photo'}
													</button>
													<button
														className='user-avatar-cancel-btn'
														onClick={cancelAvatarPreview}
														disabled={avatarUploading}
													>
														Cancel
													</button>
												</div>
											)}
											{avatarError && (
												<span className='user-edit-error'>{avatarError}</span>
											)}

											<div className='user-header-name'>
												{userInfo.username}
											</div>
											<div className='user-header-role'>
												{userInfo.role || 'Member'}
											</div>
										</div>

										<div className='user-info-group'>
											<span className='user-info-label'>Username</span>
											{editingUsername ? (
												<div className='user-edit-row'>
													<input
														ref={inputRef}
														className='user-edit-input'
														value={usernameInput}
														onChange={(e) => {
															setUsernameInput(e.target.value);
															setSaveError('');
														}}
														onKeyDown={handleKeyDown}
														maxLength={32}
														disabled={saveLoading}
														aria-label='Edit username'
														spellCheck={false}
													/>
													<button
														className='user-edit-btn user-edit-save'
														onClick={saveUsername}
														disabled={saveLoading}
														aria-label='Save username'
														title='Save'
													>
														{saveLoading ? (
															<Loader size={13} className='user-edit-spinner' />
														) : (
															<Check size={13} strokeWidth={2.5} />
														)}
													</button>
													<button
														className='user-edit-btn user-edit-cancel'
														onClick={cancelEditUsername}
														disabled={saveLoading}
														aria-label='Cancel'
														title='Cancel'
													>
														<X size={13} strokeWidth={2.5} />
													</button>
												</div>
											) : (
												<div className='user-info-value-row'>
													<span className='user-info-value'>
														{userInfo.username}
													</span>
													<button
														className='user-inline-edit-btn'
														onClick={startEditUsername}
														aria-label='Edit username'
														title='Edit username'
													>
														<Pencil size={12} strokeWidth={2} />
													</button>
												</div>
											)}
											{saveError && (
												<span className='user-edit-error'>{saveError}</span>
											)}
											{saveSuccess && (
												<span className='user-edit-success'>
													Username updated
												</span>
											)}
										</div>

										<div className='user-info-group'>
											<span className='user-info-label'>Email</span>
											<span className='user-info-value'>
												{userInfo.email || 'Not provided'}
											</span>
										</div>

										<div className='user-info-group'>
											<span className='user-info-label'>User ID</span>
											<span className='user-info-value user-info-mono'>
												{userInfo.id}
											</span>
										</div>

										<div className='user-info-group'>
											<span className='user-info-label'>Member since</span>
											<span className='user-info-value'>{formattedDate}</span>
										</div>
									</>
								)}

								{activeTab === 'account' && (
									<>
										<div className='user-info-group'>
											<span className='user-info-label'>Account Status</span>
											<span className='user-info-value'>
												<span className='user-status-dot' aria-hidden='true' />
												Active
											</span>
										</div>
										<div className='user-info-group'>
											<span className='user-info-label'>Role</span>
											<span className='user-info-value'>
												{userInfo.role || 'Member'}
											</span>
										</div>
										<div className='user-info-group'>
											<span className='user-info-label'>Permissions</span>
											<span className='user-info-value'>Standard Access</span>
										</div>
										<div className='user-info-group'>
											<span className='user-info-label'>Password</span>
											<button
												className='user-change-password-btn'
												onClick={() => setShowChangePassword(true)}
											>
												Change Password
											</button>
										</div>
									</>
								)}
							</>
						) : (
							<div className='user-panel-loading'>
								<span>Failed to load user information</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{showChangePassword && (
				<ChangePasswordModal
					userId={userId}
					onClose={() => setShowChangePassword(false)}
				/>
			)}
		</>
	);
}

export default UserProfilePanel;
