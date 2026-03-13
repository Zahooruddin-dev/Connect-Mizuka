import { useState, useEffect, useRef, useCallback } from 'react';
import {
	X,
	LogOut,
	Plus,
	Building2,
	Check,
	Copy,
	Users,
	ChevronDown,
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { linkToInstitute, getInstituteMembers } from '../services/api';
import Toast from './Toast';
import UserProfilePopover from './Userprofilepopover';
import './styles/Institutepanel.css';

// Module-level cache — members lists don't change often, no need to refetch
// every time the panel opens. Shape: Map<instituteId, Member[]>
const membersCache = new Map();

export default function InstitutePanel({ onClose, onStartP2P }) {
	const {
		user,
		institutes,
		activeInstitute,
		addInstitute,
		removeInstitute,
		setActiveInstitute,
	} = useAuth();

	const [adding, setAdding] = useState(false);
	const [newId, setNewId] = useState('');
	const [newLabel, setNewLabel] = useState('');
	const [addError, setAddError] = useState('');
	const [addLoading, setAddLoading] = useState(false);
	const [leaveTarget, setLeaveTarget] = useState(null);
	const [copiedId, setCopiedId] = useState(null);
	const [toast, setToast] = useState({
		visible: false,
		message: '',
		type: 'success',
	});
	const [members, setMembers] = useState(
		membersCache.get(activeInstitute?.id) || [],
	);
	const [membersOpen, setMembersOpen] = useState(false);
	const [membersLoading, setMembersLoading] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);

	const toastTimer = useRef(null);
	const panelRef = useRef(null);
	const firstFocusRef = useRef(null);

	useEffect(() => {
		firstFocusRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onClose]);

	useEffect(() => () => clearTimeout(toastTimer.current), []);

	// Fetch members when panel opens or active institute changes.
	// Stale-while-revalidate — show cache instantly, refresh silently.
	useEffect(() => {
		if (!activeInstitute?.id) return;

		const hit = membersCache.get(activeInstitute.id);
		if (hit) setMembers(hit);
		else setMembersLoading(true);

		getInstituteMembers(activeInstitute.id)
			.then((fresh) => {
				if (!fresh) return;
				membersCache.set(activeInstitute.id, fresh);
				setMembers(fresh);
			})
			.finally(() => setMembersLoading(false));
	}, [activeInstitute?.id]);

	const showToast = useCallback((message, type = 'success') => {
		setToast({ visible: true, message, type });
		clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => {
			setToast((prev) => ({ ...prev, visible: false }));
			setTimeout(() => setCopiedId(null), 300);
		}, 2200);
	}, []);

	const handleBackdropClick = useCallback(
		(e) => {
			if (e.target === e.currentTarget) onClose();
		},
		[onClose],
	);

	const handleCopyId = useCallback(
		async (id) => {
			try {
				await navigator.clipboard.writeText(id);
				setCopiedId(id);
				showToast('ID copied to clipboard', 'success');
			} catch {
				showToast('Failed to copy', 'error');
			}
		},
		[showToast],
	);

	const handleSelect = useCallback(
		(institute) => {
			setActiveInstitute(institute);
			onClose();
		},
		[setActiveInstitute, onClose],
	);

	const handleLeaveConfirm = useCallback(() => {
		const label = leaveTarget.label;
		removeInstitute(leaveTarget.id);
		// Evict from cache on leave
		membersCache.delete(leaveTarget.id);
		setLeaveTarget(null);
		showToast(`Left ${label}`, 'error');
	}, [leaveTarget, removeInstitute, showToast]);

	const resetAddForm = useCallback(() => {
		setAdding(false);
		setAddError('');
		setNewId('');
		setNewLabel('');
	}, []);

	const handleAddSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			const trimmedId = newId.trim();
			if (!trimmedId) {
				setAddError('Institute ID is required');
				return;
			}
			if (institutes.find((i) => i.id === trimmedId)) {
				setAddError('You already belong to this institute');
				return;
			}
			setAddLoading(true);
			const res = await linkToInstitute(user.id, trimmedId);
			setAddLoading(false);
			if (res.message && res.message !== 'Linked to institute') {
				setAddError(res.message);
				return;
			}
			addInstitute({
				id: res.membership.institute_id,
				label: newLabel.trim() || trimmedId,
				role: res.membership.role || 'member',
			});
			setNewId('');
			setNewLabel('');
			setAdding(false);
			showToast('Joined institute', 'success');
		},
		[
			newId,
			newLabel,
			institutes,
			user.id,
			addInstitute,
			linkToInstitute,
			showToast,
		],
	);

	const adminCount = members.filter((m) => m.role === 'admin').length;
	const memberCount = members.length;

	return (
		<div
			className='ipanel-backdrop'
			onClick={handleBackdropClick}
			role='dialog'
			aria-modal='true'
			aria-label='Manage institutes'
		>
			<Toast
				message={toast.message}
				visible={toast.visible}
				type={toast.type}
			/>

			<div className='ipanel' ref={panelRef}>
				<div className='ipanel-header'>
					<div className='ipanel-header-left'>
						<Building2
							size={16}
							strokeWidth={1.5}
							className='ipanel-header-icon'
							aria-hidden='true'
						/>
						<h2 className='ipanel-title'>Institutes</h2>
					</div>
					<button
						className='ipanel-close'
						onClick={onClose}
						aria-label='Close panel'
						ref={firstFocusRef}
					>
						<X size={16} strokeWidth={2} aria-hidden='true' />
					</button>
				</div>

				<div className='ipanel-body'>
					{institutes.length === 0 ? (
						<div className='ipanel-empty-state'>
							<Building2
								size={36}
								strokeWidth={1}
								className='ipanel-empty-icon'
								aria-hidden='true'
							/>
							<p className='ipanel-empty'>
								You haven't joined any institutes yet.
							</p>
						</div>
					) : (
						<ul
							className='ipanel-list'
							role='listbox'
							aria-label='Your institutes'
						>
							{institutes.map((inst) => (
								<li key={inst.id} className='ipanel-item'>
									<button
										className={`ipanel-item-btn${activeInstitute?.id === inst.id ? ' active' : ''}`}
										onClick={() => handleSelect(inst)}
										role='option'
										aria-selected={activeInstitute?.id === inst.id}
									>
										<span className='ipanel-item-icon' aria-hidden='true'>
											{inst.label[0].toUpperCase()}
										</span>
										<span className='ipanel-item-info'>
											<span className='ipanel-item-label'>{inst.label}</span>
											{inst.label !== inst.id && (
												<span
													className='ipanel-item-id'
													onClick={(e) => {
														e.stopPropagation();
														handleCopyId(inst.id);
													}}
													role='button'
													tabIndex={0}
													onKeyDown={(e) => {
														if (e.key === 'Enter' || e.key === ' ') {
															e.stopPropagation();
															handleCopyId(inst.id);
														}
													}}
												>
													{inst.id}
												</span>
											)}
										</span>
										{activeInstitute?.id === inst.id && (
											<span className='ipanel-active-badge' aria-hidden='true'>
												<Check size={10} strokeWidth={3} />
												active
											</span>
										)}
									</button>

									<button
										className={`ipanel-copy-btn${copiedId === inst.id ? ' copied' : ''}`}
										onClick={() => handleCopyId(inst.id)}
										aria-label={`Copy ID for ${inst.label}`}
										title='Copy institute ID'
									>
										{copiedId === inst.id ? (
											<Check size={13} strokeWidth={3} aria-hidden='true' />
										) : (
											<Copy size={13} strokeWidth={2} aria-hidden='true' />
										)}
									</button>

									<button
										className='ipanel-leave-btn'
										onClick={() => setLeaveTarget(inst)}
										aria-label={`Leave ${inst.label}`}
										title='Leave institute'
									>
										<LogOut size={14} strokeWidth={2} aria-hidden='true' />
									</button>
								</li>
							))}
						</ul>
					)}

					{!adding ? (
						<button className='ipanel-add-btn' onClick={() => setAdding(true)}>
							<Plus size={14} strokeWidth={2.5} aria-hidden='true' />
							Join an institute
						</button>
					) : (
						<form
							className='ipanel-add-form'
							onSubmit={handleAddSubmit}
							noValidate
						>
							<p className='ipanel-add-heading'>Join a new institute</p>
							{addError && (
								<p className='ipanel-add-error' role='alert'>
									{addError}
								</p>
							)}
							<label className='ipanel-label' htmlFor='new-inst-id'>
								Institute ID
							</label>
							<input
								id='new-inst-id'
								className='ipanel-input'
								type='text'
								value={newId}
								onChange={(e) => {
									setNewId(e.target.value);
									setAddError('');
								}}
								placeholder='Paste the UUID here'
								required
								autoFocus
								autoComplete='off'
								spellCheck={false}
							/>
							<label className='ipanel-label' htmlFor='new-inst-label'>
								Nickname <span className='ipanel-optional'>(optional)</span>
							</label>
							<input
								id='new-inst-label'
								className='ipanel-input'
								type='text'
								value={newLabel}
								onChange={(e) => setNewLabel(e.target.value)}
								placeholder='e.g. Springfield High'
								autoComplete='off'
							/>
							<div className='ipanel-add-actions'>
								<button
									type='submit'
									className='ipanel-confirm-btn'
									disabled={addLoading}
								>
									{addLoading ? 'Joining…' : 'Join'}
								</button>
								<button
									type='button'
									className='ipanel-cancel-btn'
									onClick={resetAddForm}
								>
									Cancel
								</button>
							</div>
						</form>
					)}

					{/* ── Members section ─────────────────────────────────── */}
					{activeInstitute && (
						<div className='ipanel-members-section'>
							<button
								className='ipanel-members-toggle'
								onClick={() => setMembersOpen((v) => !v)}
								aria-expanded={membersOpen}
							>
								<div className='ipanel-members-toggle-left'>
									<Users size={13} strokeWidth={2} aria-hidden='true' />
									<span>Members</span>
									{memberCount > 0 && (
										<span className='ipanel-members-count'>{memberCount}</span>
									)}
								</div>
								<ChevronDown
									size={13}
									strokeWidth={2}
									className={`ipanel-members-chevron${membersOpen ? ' open' : ''}`}
									aria-hidden='true'
								/>
							</button>

							{membersOpen && (
								<div className='ipanel-members-list'>
									{membersLoading && members.length === 0 ? (
										<div className='ipanel-members-loading'>
											<span />
											<span />
											<span />
										</div>
									) : members.length === 0 ? (
										<p className='ipanel-members-empty'>No members found</p>
									) : (
										<>
											{adminCount > 0 && (
												<p className='ipanel-members-group-label'>Admins</p>
											)}
											{members
												.filter((m) => m.role === 'admin')
												.map((m) => (
													<MemberRow
														key={m.id}
														member={m}
														isYou={m.id === user.id}
														onClick={() => setSelectedUser(m.id)}
													/>
												))}
											{members.filter((m) => m.role !== 'admin').length > 0 && (
												<p className='ipanel-members-group-label'>Members</p>
											)}
											{members
												.filter((m) => m.role !== 'admin')
												.map((m) => (
													<MemberRow
														key={m.id}
														member={m}
														isYou={m.id === user.id}
														onClick={() => setSelectedUser(m.id)}
													/>
												))}
										</>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{leaveTarget && (
				<div
					className='ipanel-leave-modal'
					role='alertdialog'
					aria-modal='true'
					aria-label='Confirm leaving institute'
				>
					<div className='ipanel-leave-card'>
						<p className='ipanel-leave-title'>Leave institute?</p>
						<p className='ipanel-leave-sub'>
							You'll be removed from <strong>{leaveTarget.label}</strong> and
							won't see its channels until you rejoin.
						</p>
						<div className='ipanel-leave-actions'>
							<button
								className='ipanel-leave-confirm'
								onClick={handleLeaveConfirm}
							>
								Leave
							</button>
							<button
								className='ipanel-leave-cancel'
								onClick={() => setLeaveTarget(null)}
							>
								Keep it
							</button>
						</div>
					</div>
				</div>
			)}

			{selectedUser && (
				<UserProfilePopover
					userId={selectedUser}
					onClose={() => setSelectedUser(null)}
					onStartP2P={(p2pData) => {
						onStartP2P?.(p2pData);
						onClose();
					}}
				/>
			)}
		</div>
	);
}

function MemberRow({ member, isYou, onClick }) {
	return (
		<button
			className='ipanel-member-row'
			onClick={onClick}
			title={`View ${member.username}'s profile`}
		>
			<div className='ipanel-member-avatar'>
				{member.username?.[0]?.toUpperCase() || 'U'}
			</div>
			<div className='ipanel-member-info'>
				<span className='ipanel-member-name'>
					{member.username}
					{isYou && <span className='ipanel-member-you'>you</span>}
				</span>
				{member.email && (
					<span className='ipanel-member-email'>{member.email}</span>
				)}
			</div>
			<span
				className={`ipanel-member-role ${member.role === 'admin' ? 'admin' : ''}`}
			>
				{member.role || 'member'}
			</span>
		</button>
	);
}
