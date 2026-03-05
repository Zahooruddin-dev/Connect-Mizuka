import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getUserProfile, getOrCreateP2PRoom } from '../services/api';
import './styles/UserProfilePopover.css';

function UserProfilePopover({ userId, onClose, onStartP2P }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [creatingRoom, setCreatingRoom] = useState(false);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			try {
				const data = await getUserProfile(userId);
				if (isMounted && data.user) {
					setUser(data.user);
				}
			} catch {
				if (isMounted) setUser(null);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		load();
		return () => {
			isMounted = false;
		};
	}, [userId]);

	const formattedDate = user?.created_at
		? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
		: null;

	const handleOverlayClick = (e) => {
		if (e.target === e.currentTarget) onClose();
	};

	const handleStartDirectMessage = async () => {
		if (!user || creatingRoom) return;
		setCreatingRoom(true);

		const res = await getOrCreateP2PRoom(user.id, userId);
		setCreatingRoom(false);

		if (res.error) {
			console.error('Failed to create P2P room:', res.error);
			return;
		}

		if (res.chatroom && typeof onStartP2P === 'function') {
			onStartP2P({
				roomId: res.chatroom.id,
				otherUserId: userId,
				otherUsername: user.username,
			});
			onClose();
		}
	};

	return (
		<div className="popover-overlay" onClick={handleOverlayClick}>
			<div
				className="user-popover"
				role="dialog"
				aria-modal="true"
				aria-labelledby="popover-title"
			>
				{loading ? (
					<div className="popover-loading">
						<span>Loading...</span>
					</div>
				) : user ? (
					<>
						<div className="popover-header">
							<button className="popover-close" onClick={onClose} aria-label="Close popover">
								<X size={18} strokeWidth={2} />
							</button>
						</div>

						<div className="popover-body">
							<div className="popover-header-center">
								<div className="popover-avatar">
									{user.username?.[0]?.toUpperCase() || 'U'}
								</div>
								<div className="popover-name">
									{user.username}
								</div>
								<div className="popover-role">
									{user.role || 'Member'}
								</div>
							</div>

							<div className="popover-info-group">
								<span className="popover-info-label">Email</span>
								<span className="popover-info-value">{user.email}</span>
							</div>

							<div className="popover-info-group">
								<span className="popover-info-label">Member Since</span>
								<span className="popover-info-value">{formattedDate}</span>
							</div>

							<div className="popover-actions">
								<button className="popover-action-btn">
									@Mention
								</button>
								<button
									className="popover-action-btn"
									onClick={handleStartDirectMessage}
									disabled={creatingRoom}
								>
									{creatingRoom ? 'Opening...' : 'Direct Message'}
								</button>
							</div>
						</div>
					</>
				) : (
					<div className="popover-loading">
						<span>User not found</span>
					</div>
				)}
			</div>
		</div>
	);
}

export default UserProfilePopover;