import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getUserProfile, getOrCreateP2PRoom } from '../services/api';
import { useAuth } from '../services/AuthContext';

const infoGroupCls = 'flex flex-col gap-1.5 mb-4 pb-4 border-b border-[var(--border)] last:border-b-0 last:mb-0 last:pb-0';
const infoLabelCls = 'text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)]';
const infoValueCls = 'text-sm text-[var(--text-secondary)] break-all';

function UserProfilePopover({ userId, onClose, onStartP2P }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [creatingRoom, setCreatingRoom] = useState(false);
	const { user: currentUser } = useAuth();

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			try {
				const data = await getUserProfile(userId);
				if (isMounted && data.user) setUser(data.user);
			} catch {
				if (isMounted) setUser(null);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		load();
		return () => { isMounted = false; };
	}, [userId]);

	const formattedDate = user?.created_at
		? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
		: null;

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) onClose();
	}

	async function handleStartDirectMessage() {
		if (!user || !currentUser || creatingRoom) return;
		if (currentUser.id === userId) { alert('You cannot message yourself'); return; }
		setCreatingRoom(true);
		try {
			const res = await getOrCreateP2PRoom(userId);
			if (res.error) { alert('Failed to open chat: ' + res.error); setCreatingRoom(false); return; }
			if (res.chatroom && typeof onStartP2P === 'function') {
				onStartP2P({ roomId: res.chatroom.id, otherUserId: userId, otherUsername: user.username });
				onClose();
			} else {
				setCreatingRoom(false);
			}
		} catch (error) {
			alert('Error: ' + error.message);
			setCreatingRoom(false);
		}
	}

	const isOwnProfile = currentUser?.id === userId;

	return (
		<div
			className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-[2000] flex items-center justify-center p-5 animate-[overlay-fade-in_0.2s_ease-out]"
			onClick={handleOverlayClick}
		>
			<div
				className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-[420px] shadow-[0_8px_28px_rgba(0,0,0,0.32)] flex flex-col overflow-hidden animate-[panel-slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]"
				role="dialog"
				aria-modal="true"
				aria-labelledby="popover-title"
			>
				{loading ? (
					<div className="flex flex-col items-center justify-center gap-3 py-10 text-[var(--text-muted)] text-sm">
						<span>Loading...</span>
					</div>
				) : user ? (
					<>
						<div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-end">
							<button
								className="w-[30px] h-[30px] flex items-center justify-center rounded-[7px] text-[var(--text-ghost)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
								onClick={onClose}
								aria-label="Close popover"
							>
								<X size={18} strokeWidth={2} />
							</button>
						</div>

						<div className="px-5 py-6 flex flex-col overflow-y-auto max-h-[70vh]">
							<div className="text-center mb-6">
								{user.profile_picture ? (
									<img
										src={user.profile_picture}
										alt={user.username}
										className="w-14 h-14 mx-auto mb-3 rounded-full object-cover"
									/>
								) : (
									<div
										className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center text-xl font-semibold text-white/90"
										style={{ background: 'linear-gradient(135deg, var(--teal-800), var(--teal-600))' }}
									>
										{user.username?.[0]?.toUpperCase() || 'U'}
									</div>
								)}
								<div className="text-base font-medium text-[var(--text-primary)] mb-1 break-words" id="popover-title">
									{user.username}
								</div>
								<div className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.06em] font-medium">
									{user.role || 'Member'}
								</div>
							</div>

							<div className={infoGroupCls}>
								<span className={infoLabelCls}>Email</span>
								<span className={infoValueCls}>{user.email}</span>
							</div>

							<div className={infoGroupCls}>
								<span className={infoLabelCls}>Member Since</span>
								<span className={infoValueCls}>{formattedDate}</span>
							</div>

							{!isOwnProfile && (
								<div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--border)]">
									<button
										className="px-3 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-[7px] text-[13px] font-medium flex items-center justify-center gap-1.5 transition-[background,border-color,color] duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
										onClick={handleStartDirectMessage}
										disabled={creatingRoom}
									>
										{creatingRoom ? 'Opening...' : 'Direct Message'}
									</button>
								</div>
							)}
						</div>
					</>
				) : (
					<div className="flex flex-col items-center justify-center gap-3 py-10 text-[var(--text-muted)] text-sm">
						<span>User not found</span>
					</div>
				)}
			</div>
		</div>
	);
}

export default UserProfilePopover;