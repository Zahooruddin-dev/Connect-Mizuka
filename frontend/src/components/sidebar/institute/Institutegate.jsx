import { useState } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { createInstitute, linkToInstitute } from '../../../services/api';

const labelCls =
	'block text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5';
const inputCls =
	'w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm outline-none transition-all duration-150 placeholder:text-[var(--text-ghost)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50';
const btnCls =
	'w-full px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-teal-700';

export default function InstituteGate() {
	const { user, logout, addInstitute, isActiveAdmin } = useAuth();
	const isAdminUser = user?.role === 'admin';
	const [instituteId, setInstituteId] = useState('');
	const [label, setLabel] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [instName, setInstName] = useState('');
	const [createError, setCreateError] = useState('');
	const [createLoading, setCreateLoading] = useState(false);

	async function handleJoin(e) {
		e.preventDefault();
		const trimmedId = instituteId.trim();
		if (!trimmedId) {
			setError('Institute ID is required');
			return;
		}
		setLoading(true);
		const res = await linkToInstitute(user.id, trimmedId);
		setLoading(false);
		if (res.message && res.message !== 'Linked to institute') {
			setError(res.message);
			return;
		}
		addInstitute({
			id: res.membership.institute_id,
			label: label.trim() || trimmedId,
			role: res.membership.role || 'member',
		});
	}

	async function handleCreate(e) {
		e.preventDefault();
		if (!instName.trim()) {
			setCreateError('Name is required');
			return;
		}
		setCreateLoading(true);
		const res = await createInstitute(user.id, instName.trim());
		setCreateLoading(false);
		if (res.institute && res.membership) {
			addInstitute({
				id: res.institute.id,
				label: res.institute.name,
				role: 'admin',
			});
			setInstName('');
			setCreateError('');
		} else {
			setCreateError(res.message || 'Failed to create institute');
		}
	}

	return (
		<>
			<style>{`
        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

			<div className='min-h-svh w-full flex items-center justify-center bg-[var(--bg-base)] relative overflow-hidden px-4'>
				{/* Background decoration */}
				<div
					aria-hidden='true'
					className='absolute w-[480px] h-[480px] rounded-full pointer-events-none'
					style={{
						background:
							'radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 70%)',
					}}
				/>

				<div className='relative w-full max-w-[440px] px-6 py-8 sm:px-8 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-lg flex flex-col animate-[card-enter_0.4s_cubic-bezier(0.16,1,0.3,1)_both]'>
					{/* Logo */}
					<div className='flex items-baseline gap-0.5 mb-6' aria-label='Mizuka'>
						<span
							className='text-[32px] font-semibold text-teal-400 leading-none tracking-[-1.5px]'
							aria-hidden='true'
						>
							M
						</span>
						<span
							className='text-[26px] font-light text-[var(--text-primary)] tracking-[-0.5px]'
							aria-hidden='true'
						>
							izuka
						</span>
						<span className='text-[16px] font-light text-[var(--text-primary)] tracking-[-0.5px] ml-0.5'>
							Connect
						</span>
					</div>

					{/* User greeting */}
					<div className='text-center mb-6'>
						<div
							className='w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-lg font-semibold text-white/90'
							style={{
								background:
									'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
							}}
							aria-hidden='true'
						>
							{user.username[0].toUpperCase()}
						</div>
						<p className='text-sm text-[var(--text-primary)] mb-1.5'>
							Hey, <strong>{user.username}</strong>
						</p>
						<p className='text-[13px] text-[var(--text-muted)] leading-relaxed'>
							You're not part of any institute yet. Enter an Institute ID to
							join one and start chatting.
						</p>
					</div>

					{/* Join form */}
					{error && (
						<p
							className='text-[13px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-md px-3 py-2.5 mb-4'
							role='alert'
						>
							{error}
						</p>
					)}
					<form onSubmit={handleJoin} noValidate>
						<label className={labelCls} htmlFor='gate-institute-id'>
							Institute ID
						</label>
						<input
							id='gate-institute-id'
							className={inputCls}
							type='text'
							value={instituteId}
							onChange={(e) => {
								setInstituteId(e.target.value);
								setError('');
							}}
							placeholder='e.g. 1c8fb7e7-5e07-409d-…'
							required
							autoFocus
							autoComplete='off'
							spellCheck={false}
						/>
						<label className={labelCls} htmlFor='gate-label'>
							Nickname{' '}
							<span className='text-[var(--text-ghost)] normal-case font-normal'>
								(optional)
							</span>
						</label>
						<input
							id='gate-label'
							className={inputCls}
							type='text'
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder='e.g. Bonaventure High School'
							autoComplete='off'
						/>
						<button className={btnCls} type='submit' disabled={loading}>
							{loading ? 'Joining…' : 'Join institute'}
						</button>
					</form>

					{/* Create institute (only for admins) */}
					{(isAdminUser || isActiveAdmin()) && (
						<div className='mt-6 pt-6 border-t border-[var(--border)]'>
							<p className='text-[13px] text-[var(--text-muted)] text-center mb-4'>
								Create your first institute
							</p>
							{createError && (
								<p
									className='text-[13px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-md px-3 py-2.5 mb-4'
									role='alert'
								>
									{createError}
								</p>
							)}
							<form onSubmit={handleCreate} noValidate>
								<label className={labelCls} htmlFor='gate-inst-name'>
									Institute Name
								</label>
								<input
									id='gate-inst-name'
									className={inputCls}
									type='text'
									value={instName}
									onChange={(e) => {
										setInstName(e.target.value);
										setCreateError('');
									}}
									placeholder='e.g. Pinecrest High'
									required
									autoComplete='off'
								/>
								<button
									className={btnCls}
									type='submit'
									disabled={createLoading}
								>
									{createLoading ? 'Creating…' : 'Create institute'}
								</button>
							</form>
						</div>
					)}

					{/* Sign out link */}
					<div className='mt-6 text-center'>
						<button
							className='text-[13px] text-[var(--text-ghost)] hover:text-[var(--text-muted)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:rounded-sm'
							onClick={logout}
						>
							Sign out
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
