import { useState, useEffect, useRef } from 'react';
import { X, Pencil, Check, Loader, Camera } from 'lucide-react';
import { fetchUserInfo, updateProfile } from '../services/api';
import ChangePasswordModal from './ChangePasswordModal';

const infoGroupCls = 'flex flex-col gap-1.5 mb-4 pb-4 border-b border-[var(--border)] last:border-b-0 last:mb-0 last:pb-0';
const infoLabelCls = 'text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)]';
const infoValueCls = 'text-sm text-[var(--text-secondary)] flex items-center gap-2';

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
		return () => { isMounted = false; };
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
		if (!trimmed) { setSaveError('Username cannot be empty'); return; }
		if (trimmed === userInfo.username) { setEditingUsername(false); return; }
		setSaveLoading(true);
		setSaveError('');
		const res = await updateProfile({ username: trimmed });
		setSaveLoading(false);
		if (res?.user) {
			setUserInfo((prev) => ({ ...prev, username: res.user.username }));
			setEditingUsername(false);
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 3000);
			if (typeof onUsernameChanged === 'function') onUsernameChanged(res.user.username);
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
			setUserInfo((prev) => ({ ...prev, profile_picture: res.user.profile_picture }));
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
		? new Date(userInfo.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
		: null;

	return (
		<>
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-[2000] flex items-center justify-center p-5 animate-[overlay-fade-in_0.2s_ease-out]"
				onClick={handleOverlayClick}
			>
				<div
					className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-[420px] shadow-[0_8px_28px_rgba(0,0,0,0.32)] flex flex-col overflow-hidden animate-[panel-slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]"
					role="dialog"
					aria-modal="true"
					aria-labelledby="user-panel-title"
				>
					<div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
						<span className="text-sm font-medium text-[var(--text-primary)]" id="user-panel-title">
							User Profile
						</span>
						<button
							className="w-[30px] h-[30px] flex items-center justify-center rounded-[7px] text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
							onClick={onClose}
							aria-label="Close panel"
						>
							<X size={18} strokeWidth={2} />
						</button>
					</div>

					<div className="flex px-4 pt-2 gap-2 border-b border-[var(--border)]">
						{['profile', 'account'].map((tab) => (
							<button
								key={tab}
								className={`relative px-3 py-2 text-[13px] font-medium rounded-t-lg transition-[color,background] duration-150 capitalize focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] ${
									activeTab === tab
										? 'text-[var(--text-secondary)] bg-teal-500/[0.04] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-px after:bg-[var(--teal-600)] after:rounded-t-sm'
										: 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02]'
								}`}
								onClick={() => setActiveTab(tab)}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
						))}
					</div>

					<div className="px-5 py-6 overflow-y-auto max-h-[70vh]">
						{loading ? (
							<div className="flex flex-col items-center justify-center gap-3 py-10 text-[var(--text-muted)] text-sm">
								<span>Loading user information…</span>
							</div>
						) : userInfo ? (
							<>
								{activeTab === 'profile' && (
									<>
										<div className="text-center mb-6">
											<div className="relative inline-flex items-center justify-center mb-2.5">
												{displayAvatar ? (
													<img
														src={displayAvatar}
														alt={userInfo.username}
														className="w-14 h-14 rounded-full object-cover"
													/>
												) : (
													<div
														className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-white/90"
														style={{ background: 'linear-gradient(135deg, var(--teal-800), var(--teal-600))' }}
													>
														{userInfo.username ? userInfo.username[0].toUpperCase() : 'U'}
													</div>
												)}
												<button
													className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full bg-[var(--bg-panel)] border-2 border-[var(--bg-surface)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
													onClick={() => fileInputRef.current?.click()}
													aria-label="Change profile picture"
													title="Change profile picture"
												>
													<Camera size={13} strokeWidth={2} />
												</button>
												<input
													ref={fileInputRef}
													type="file"
													accept="image/jpeg,image/png,image/webp,image/avif"
													className="hidden"
													onChange={handleAvatarFileChange}
													aria-label="Upload profile picture"
												/>
											</div>

											{avatarFile && (
												<div className="flex items-center justify-center gap-2 mb-2">
													<button
														className="flex items-center gap-[5px] px-3 py-[5px] rounded-md bg-[var(--teal-600)] text-white text-[12px] font-medium transition-[background] duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[var(--teal-700)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
														onClick={uploadAvatar}
														disabled={avatarUploading}
													>
														{avatarUploading
															? <Loader size={12} className="animate-spin-fast" />
															: <Check size={12} strokeWidth={2.5} />}
														{avatarUploading ? 'Uploading…' : 'Save photo'}
													</button>
													<button
														className="px-3 py-[5px] rounded-md border border-[var(--border)] text-[var(--text-muted)] text-[12px] transition-[background] duration-150 disabled:opacity-60 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
														onClick={cancelAvatarPreview}
														disabled={avatarUploading}
													>
														Cancel
													</button>
												</div>
											)}
											{avatarError && (
												<span className="text-[12px] text-red-400">{avatarError}</span>
											)}

											<div className="text-base font-medium text-[var(--text-primary)] mb-1">
												{userInfo.username}
											</div>
											<div className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.06em] font-medium">
												{userInfo.role || 'Member'}
											</div>
										</div>

										<div className={`${infoGroupCls} group`}>
											<span className={infoLabelCls}>Username</span>
											{editingUsername ? (
												<div className="flex items-center gap-1.5">
													<input
														ref={inputRef}
														className="flex-1 px-2.5 py-[7px] bg-[var(--bg-input)] border border-[var(--teal-600)] rounded-lg text-[var(--text-primary)] text-sm outline-none shadow-[0_0_0_2px_rgba(20,184,166,0.07)] font-[inherit] transition-[border-color,box-shadow] duration-150 disabled:opacity-50"
														value={usernameInput}
														onChange={(e) => { setUsernameInput(e.target.value); setSaveError(''); }}
														onKeyDown={handleKeyDown}
														maxLength={32}
														disabled={saveLoading}
														aria-label="Edit username"
														spellCheck={false}
													/>
													<button
														className="w-7 h-7 flex items-center justify-center rounded-[7px] text-[var(--teal-600)] flex-shrink-0 transition-[background,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-500/[0.08] hover:text-[var(--teal-500)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
														onClick={saveUsername}
														disabled={saveLoading}
														aria-label="Save username"
														title="Save"
													>
														{saveLoading
															? <Loader size={13} className="animate-spin-fast" />
															: <Check size={13} strokeWidth={2.5} />}
													</button>
													<button
														className="w-7 h-7 flex items-center justify-center rounded-[7px] text-[var(--text-ghost)] flex-shrink-0 transition-[background,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-400/[0.08] hover:text-red-400 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
														onClick={cancelEditUsername}
														disabled={saveLoading}
														aria-label="Cancel"
														title="Cancel"
													>
														<X size={13} strokeWidth={2.5} />
													</button>
												</div>
											) : (
												<div className="flex items-center gap-2">
													<span className={infoValueCls}>{userInfo.username}</span>
													<button
														className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-ghost)] opacity-0 group-hover:opacity-100 transition-[opacity,background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:opacity-100"
														onClick={startEditUsername}
														aria-label="Edit username"
														title="Edit username"
													>
														<Pencil size={12} strokeWidth={2} />
													</button>
												</div>
											)}
											{saveError && <span className="text-[12px] text-red-400">{saveError}</span>}
											{saveSuccess && <span className="text-[12px] text-[var(--teal-600)]">Username updated</span>}
										</div>

										<div className={infoGroupCls}>
											<span className={infoLabelCls}>Email</span>
											<span className={infoValueCls}>{userInfo.email || 'Not provided'}</span>
										</div>

										<div className={infoGroupCls}>
											<span className={infoLabelCls}>User ID</span>
											<span className="text-[12px] font-mono text-[var(--text-ghost)]">{userInfo.id}</span>
										</div>

										<div className={infoGroupCls}>
											<span className={infoLabelCls}>Member since</span>
											<span className={infoValueCls}>{formattedDate}</span>
										</div>
									</>
								)}

								{activeTab === 'account' && (
									<>
										<div className={infoGroupCls}>
											<span className={infoLabelCls}>Account Status</span>
											<span className={infoValueCls}>
												<span className="w-1.5 h-1.5 rounded-full bg-[var(--teal-600)] shrink-0" aria-hidden="true" />
												Active
											</span>
										</div>
										<div className={infoGroupCls}>
											<span className={infoLabelCls}>Role</span>
											<span className={infoValueCls}>{userInfo.role || 'Member'}</span>
										</div>
										<div className={infoGroupCls}>
											<span className={infoLabelCls}>Permissions</span>
											<span className={infoValueCls}>Standard Access</span>
										</div>
										<div className={infoGroupCls}>
											<span className={infoLabelCls}>Password</span>
											<button
												className="self-start px-3.5 py-[7px] rounded-lg border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)] text-[13px] font-medium font-[inherit] cursor-pointer transition-[background,border-color,color] duration-150 hover:bg-teal-500/[0.06] hover:border-[var(--teal-700)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
												onClick={() => setShowChangePassword(true)}
											>
												Change Password
											</button>
										</div>
									</>
								)}
							</>
						) : (
							<div className="flex flex-col items-center justify-center gap-3 py-10 text-[var(--text-muted)] text-sm">
								<span>Failed to load user information</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{showChangePassword && (
				<ChangePasswordModal userId={userId} onClose={() => setShowChangePassword(false)} />
			)}
		</>
	);
}

export default UserProfilePanel;
