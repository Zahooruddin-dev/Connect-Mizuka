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
import {
	linkToInstitute,
	getInstituteMembers,
	createInstitute,
} from '../services/api';
import Toast from './Toast';
import UserProfilePopover from './Userprofilepopover';
const membersCache = new Map();

const labelCls =
	'block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5';
const inputCls =
	'w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-ghost)] focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.07)] disabled:opacity-50';
const iconBtnCls =
	'flex items-center justify-center w-7 h-7 rounded-lg transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

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
			onClose();
		},
		[setActiveInstitute, onClose],
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
	const adminCount = members.filter((m) => m.role === 'admin').length;
	const memberCount = members.length;

	return (
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
				className='bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-[440px] max-h-[80vh] shadow-[0_8px_28px_rgba(0,0,0,0.32)] flex flex-col overflow-hidden animate-[panel-slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]'
			>
				<div className='flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0'>
					<div className='flex items-center gap-2'>
						<Building2
							size={15}
							strokeWidth={1.5}
							className='text-[var(--text-muted)] shrink-0'
							aria-hidden='true'
						/>
						<h2 className='text-sm font-medium text-[var(--text-primary)]'>
							Institutes
						</h2>
					</div>
					<button
						ref={firstFocusRef}
						className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]`}
						onClick={onClose}
						aria-label='Close panel'
					>
						<X size={16} strokeWidth={2} />
					</button>
				</div>

				<div className='flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4'>
					{institutes.length === 0 ? (
						<div className='flex flex-col items-center justify-center gap-3 py-8'>
							<Building2
								size={36}
								strokeWidth={1}
								className='text-[var(--text-ghost)]'
								aria-hidden='true'
							/>
							<p className='text-[13px] text-[var(--text-muted)] text-center'>
								You haven't joined any institutes yet.
							</p>
						</div>
					) : (
						<ul
							className='flex flex-col gap-1'
							role='listbox'
							aria-label='Your institutes'
						>
							{institutes.map((inst) => (
								<li key={inst.id} className='flex items-center gap-1'>
									<button
										className={`flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-[background,border-color] duration-150 border focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] ${activeInstitute?.id === inst.id ? 'bg-teal-500/[0.06] border-teal-500/[0.15]' : 'border-transparent hover:bg-[var(--bg-hover)]'}`}
										onClick={() => handleSelect(inst)}
										role='option'
										aria-selected={activeInstitute?.id === inst.id}
									>
										<span
											className='w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0'
											style={{
												background:
													'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
											}}
											aria-hidden='true'
										>
											{inst.label[0].toUpperCase()}
										</span>
										<span className='min-w-0 flex-1'>
											<span className='block text-[13px] font-medium text-[var(--text-primary)] truncate'>
												{inst.label}
											</span>
											{inst.label !== inst.id && (
												<span
													className='block text-[11px] text-[var(--text-ghost)] font-mono truncate cursor-pointer hover:text-[var(--text-muted)] transition-colors'
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
											<span
												className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/[0.12] text-teal-600 text-[10px] font-medium shrink-0'
												aria-hidden='true'
											>
												<Check size={9} strokeWidth={3} />
												active
											</span>
										)}
									</button>

									<button
										className={`${iconBtnCls} shrink-0 ${copiedId === inst.id ? 'bg-teal-500/[0.1] text-teal-500' : 'text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]'}`}
										onClick={() => handleCopyId(inst.id)}
										aria-label={`Copy ID for ${inst.label}`}
										title='Copy institute ID'
									>
										{copiedId === inst.id ? (
											<Check size={12} strokeWidth={3} aria-hidden='true' />
										) : (
											<Copy size={12} strokeWidth={2} aria-hidden='true' />
										)}
									</button>

									<button
										className={`${iconBtnCls} shrink-0 text-[var(--text-ghost)] hover:bg-red-400/[0.06] hover:text-red-400`}
										onClick={() => setLeaveTarget(inst)}
										aria-label={`Leave ${inst.label}`}
										title='Leave institute'
									>
										<LogOut size={13} strokeWidth={2} aria-hidden='true' />
									</button>
								</li>
							))}
						</ul>
					)}

					{!adding ? (
						<button
							className='flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-[var(--border-strong)] text-[13px] text-[var(--text-muted)] transition-[background,border-color,color] duration-150 hover:bg-[var(--bg-hover)] hover:border-[var(--teal-700)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={() => setAdding(true)}
						>
							<Plus size={14} strokeWidth={2.5} aria-hidden='true' />
							Join an institute
						</button>
					) : (
						<form
							className='flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)]'
							onSubmit={handleAddSubmit}
							noValidate
						>
							<p className='text-[13px] font-medium text-[var(--text-primary)]'>
								Join a new institute
							</p>
							{addError && (
								<p
									className='text-[12px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-md px-2.5 py-1.5'
									role='alert'
								>
									{addError}
								</p>
							)}
							<div>
								<label className={labelCls} htmlFor='new-inst-id'>
									Institute ID
								</label>
								<input
									id='new-inst-id'
									className={inputCls}
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
							</div>
							<div>
								<label className={labelCls} htmlFor='new-inst-label'>
									Nickname{' '}
									<span className='text-[var(--text-ghost)] normal-case font-normal'>
										(optional)
									</span>
								</label>
								<input
									id='new-inst-label'
									className={inputCls}
									type='text'
									value={newLabel}
									onChange={(e) => setNewLabel(e.target.value)}
									placeholder='e.g. Springfield High'
									autoComplete='off'
								/>
							</div>
							<div className='flex gap-2'>
								<button
									type='submit'
									className='flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium rounded-lg transition-[background] duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
									disabled={addLoading}
								>
									{addLoading ? 'Joining…' : 'Join'}
								</button>
								<button
									type='button'
									className='px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] text-[13px] font-medium rounded-lg transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
									onClick={resetAddForm}
								>
									Cancel
								</button>
							</div>
						</form>
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
								<form
									className='flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)]'
									onSubmit={handleCreateSubmit}
									noValidate
								>
									<p className='text-[13px] font-medium text-[var(--text-primary)]'>
										Create a new institute
									</p>
									{createError && (
										<p
											className='text-[12px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-md px-2.5 py-1.5'
											role='alert'
										>
											{createError}
										</p>
									)}
									<div>
										<label className={labelCls} htmlFor='new-inst-name'>
											Institute Name
										</label>
										<input
											id='new-inst-name'
											className={inputCls}
											type='text'
											value={newInstName}
											onChange={(e) => {
												setNewInstName(e.target.value);
												setCreateError('');
											}}
											placeholder='e.g. Pinecrest High'
											required
											autoFocus
											autoComplete='off'
										/>
									</div>
									<div className='flex gap-2'>
										<button
											type='submit'
											className='flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium rounded-lg transition-[background] duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
											disabled={createLoading}
										>
											{createLoading ? 'Creating…' : 'Create'}
										</button>
										<button
											type='button'
											className='px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] text-[13px] font-medium rounded-lg transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
											onClick={resetCreateForm}
										>
											Cancel
										</button>
									</div>
								</form>
							)}
						</div>
					)}

					{activeInstitute && (
						<div>
							<button
								className='flex items-center justify-between w-full px-2 py-2 rounded-lg text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
								onClick={() => setMembersOpen((v) => !v)}
								aria-expanded={membersOpen}
							>
								<div className='flex items-center gap-2'>
									<Users size={13} strokeWidth={2} aria-hidden='true' />
									<span>Members</span>
									{memberCount > 0 && (
										<span className='px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[10px] text-[var(--text-ghost)]'>
											{memberCount}
										</span>
									)}
								</div>
								<ChevronDown
									size={13}
									strokeWidth={2}
									className={`text-[var(--text-ghost)] transition-transform duration-200 ${membersOpen ? 'rotate-180' : ''}`}
									aria-hidden='true'
								/>
							</button>

							{membersOpen && (
								<div className='mt-1 flex flex-col'>
									{membersLoading && members.length === 0 ? (
										<div className='flex items-center gap-1.5 px-3 py-3'>
											{[0, 150, 300].map((delay) => (
												<span
													key={delay}
													className='w-1.5 h-1.5 rounded-full bg-[var(--teal-800)] animate-[bounce-dot_1.2s_ease-in-out_infinite]'
													style={{ animationDelay: `${delay}ms` }}
												/>
											))}
										</div>
									) : members.length === 0 ? (
										<p className='text-[12px] text-[var(--text-ghost)] px-3 py-2'>
											No members found
										</p>
									) : (
										<>
											{adminCount > 0 && (
												<p className='text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)] px-3 py-1.5'>
													Admins
												</p>
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
												<p className='text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-ghost)] px-3 py-1.5 mt-1'>
													Members
												</p>
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
					className='absolute inset-0 flex items-center justify-center p-4 bg-black/20'
					role='alertdialog'
					aria-modal='true'
					aria-label='Confirm leaving institute'
				>
					<div className='w-full max-w-[320px] bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-2xl shadow-lg p-6 flex flex-col gap-3 animate-[panel-slide-up_0.2s_cubic-bezier(0.16,1,0.3,1)]'>
						<p className='text-sm font-medium text-[var(--text-primary)]'>
							Leave institute?
						</p>
						<p className='text-[13px] text-[var(--text-muted)] leading-relaxed'>
							You'll be removed from{' '}
							<strong className='text-[var(--text-primary)]'>
								{leaveTarget.label}
							</strong>{' '}
							and won't see its channels until you rejoin.
						</p>
						<div className='flex gap-2 mt-1'>
							<button
								className='flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-medium rounded-lg transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-red-400'
								onClick={handleLeaveConfirm}
							>
								Leave
							</button>
							<button
								className='flex-1 px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] text-[13px] font-medium rounded-lg transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
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
			className='w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-[background] duration-150 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
			onClick={onClick}
			title={`View ${member.username}'s profile`}
		>
			<div
				className='w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0'
				style={{
					background:
						'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
				}}
				aria-hidden='true'
			>
				{member.username?.[0]?.toUpperCase() || 'U'}
			</div>
			<div className='flex-1 min-w-0'>
				<div className='flex items-center gap-1.5'>
					<span className='text-[13px] text-[var(--text-secondary)] truncate'>
						{member.username}
					</span>
					{isYou && (
						<span className='px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[10px] text-[var(--text-ghost)]'>
							you
						</span>
					)}
				</div>
				{member.email && (
					<span className='block text-[11px] text-[var(--text-ghost)] truncate'>
						{member.email}
					</span>
				)}
			</div>
			<span
				className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${member.role === 'admin' ? 'bg-teal-500/[0.1] text-teal-600' : 'bg-[var(--bg-hover)] text-[var(--text-ghost)]'}`}
			>
				{member.role || 'member'}
			</span>
		</button>
	);
}
