import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getUserProfile } from '../services/api';
import './styles/UserProfilePopover.css';

function UserProfilePopover({ userId, position, onClose }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

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
		? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
		: null;

	return (
		<div className="popover-overlay" onClick={onClose}>
			<div
				className="user-popover"
				style={{
					top: `${position.top}px`,
					left: `${position.left}px`,
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{loading ? (
					<div className="popover-loading">
						<span>Loading...</span>
					</div>
				) : user ? (
					<>
						<div className="popover-header">
							<button className="popover-close" onClick={onClose} aria-label="Close">
								<X size={16} strokeWidth={2} />
							</button>
						</div>

						<div className="popover-body">
							<div className="popover-avatar">
								{user.username?.[0]?.toUpperCase() || 'U'}
							</div>

							<div className="popover-name">
								{user.username}
							</div>

							<div className="popover-role">
								{user.role || 'Member'}
							</div>

							<div className="popover-divider"></div>

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
									<span>@Mention</span>
								</button>
								<button className="popover-action-btn popover-action-disabled" disabled>
									<span>Direct Message</span>
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