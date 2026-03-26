import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import {
	linkToInstitute,
	getInstituteMembers,
	createInstitute,
} from '../../services/api';
import Toast from '../Toast';
import UserProfilePopover from '../sidebar/profile/Userprofilepopover';
import SidebarHeader from './SidebarHeader';
import InstitutesList from './InstitutesList';
import JoinInstituteForm from './JoinInstituteForm';
import CreateInstituteForm from './CreateInstituteForm';
import MembersSection from './MembersSection';
import LeaveConfirmDialog from './LeaveConfirmDialog';

const membersCache = new Map();

export default function InstituteSidebar({ onClose, onStartP2P }) {
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
	const [creating, setCreating] = useState(false);
	const [newInstName, setNewInstName] = useState('');
	const [createError, setCreateError] = useState('');
	const [createLoading, setCreateLoading] = useState(false);

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
		},
		[setActiveInstitute],
	);

	const handleLeaveConfirm = useCallback(() => {
		const label = leaveTarget.label;
		removeInstitute(leaveTarget.id);
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
		[newId, newLabel, institutes, user.id, addInstitute, showToast],
	);

	const resetCreateForm = useCallback(() => {
		setCreating(false);
		setCreateError('');
		setNewInstName('');
	}, []);

	const handleCreateSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			if (!newInstName.trim()) {
				setCreateError('Name is required');
				return;
			}
			setCreateLoading(true);
			const res = await createInstitute(newInstName.trim());
			setCreateLoading(false);
			if (res.institute) {
				const entry = {
					id: res.institute.id,
					label: res.institute.name,
					role: 'admin',
				};
				addInstitute(entry);
				setActiveInstitute(entry);
				setNewInstName('');
				setCreating(false);
				showToast('Institute created', 'success');
				onClose();
			} else {
				setCreateError(res.message || 'Failed to create institute');
			}
		},
		[newInstName, addInstitute, setActiveInstitute, onClose, showToast],
	);

	return (
		<>
			<style>{`
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
				aria-label='Manage institutes'
			>
				<Toast
					message={toast.message}
					visible={toast.visible}
					type={toast.type}
				/>

				<div
					ref={panelRef}
					className='bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-[440px] max-h-[80vh] shadow-[0_8px_28px_rgba(0,0,0,0.32)] flex flex-col overflow-hidden animate-[modal-pop_0.2s_cubic-bezier(0.16,1,0.3,1)]'
				>
					<SidebarHeader onClose={onClose} firstFocusRef={firstFocusRef} />

					<div className='flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4'>
						<InstitutesList
							institutes={institutes}
							activeInstitute={activeInstitute}
							copiedId={copiedId}
							onSelect={handleSelect}
							onCopyId={handleCopyId}
							onLeave={(inst) => setLeaveTarget(inst)}
						/>

						{!adding ? (
							<button
								className='flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-[var(--border-strong)] text-[13px] text-[var(--text-muted)] transition-[background,border-color,color] duration-150 hover:bg-[var(--bg-hover)] hover:border-[var(--teal-700)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
								onClick={() => setAdding(true)}
							>
								<Plus size={14} strokeWidth={2.5} aria-hidden='true' />
								Join an institute
							</button>
						) : (
							<JoinInstituteForm
								newId={newId}
								newLabel={newLabel}
								addError={addError}
								addLoading={addLoading}
								onIdChange={(id) => {
									setNewId(id);
									setAddError('');
								}}
								onLabelChange={setNewLabel}
								onSubmit={handleAddSubmit}
								onCancel={resetAddForm}
							/>
						)}

						{user.role === 'admin' && (
							<div className='border-t border-[var(--border)] pt-4'>
								{!creating ? (
									<button
										className='flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-[var(--border-strong)] text-[13px] text-[var(--text-muted)] transition-[background,border-color,color] duration-150 hover:bg-[var(--bg-hover)] hover:border-[var(--teal-700)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
										onClick={() => setCreating(true)}
									>
										<Plus size={14} strokeWidth={2.5} aria-hidden='true' />
										Create new institute
									</button>
								) : (
									<CreateInstituteForm
										newInstName={newInstName}
										createError={createError}
										createLoading={createLoading}
										onNameChange={(name) => {
											setNewInstName(name);
											setCreateError('');
										}}
										onSubmit={handleCreateSubmit}
										onCancel={resetCreateForm}
									/>
								)}
							</div>
						)}

						{activeInstitute && (
							<MembersSection
								members={members}
								membersOpen={membersOpen}
								membersLoading={membersLoading}
								onOpenChange={setMembersOpen}
								onMemberSelect={(userId) => setSelectedUser(userId)}
								currentUserId={user.id}
							/>
						)}
					</div>
				</div>

				{leaveTarget && (
					<LeaveConfirmDialog
						target={leaveTarget}
						onConfirm={handleLeaveConfirm}
						onCancel={() => setLeaveTarget(null)}
					/>
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
		</>
	);
}