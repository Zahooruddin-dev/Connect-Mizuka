import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import {
	login,
	register,
	requestPasswordReset,
	resetPassword,
	fetchMemberships,
} from '../services/api';

const VIEWS = {
	LOGIN: 'login',
	REGISTER: 'register',
	RESET_REQ: 'reset_req',
	RESET_CONFIRM: 'reset_confirm',
};

function inputCls(invalid) {
	return (
		'w-full px-3.5 py-2.5 border rounded-[var(--radius-md)] text-sm outline-none ' +
		'transition-[border-color,box-shadow] duration-200 appearance-none font-[inherit] ' +
		'placeholder:text-[var(--text-ghost)] ' +
		'[-webkit-text-fill-color:var(--text-primary)] ' +
		'[color-scheme:light_dark] ' +
		'bg-[var(--bg-input)] text-[var(--text-primary)] ' +
		'focus:ring-2 focus:ring-offset-0 ' +
		(invalid
			? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
			: 'border-[var(--border)] focus:border-teal-500 focus:ring-teal-500/10')
	);
}

const labelCls =
	'block text-[11px] font-medium text-[var(--text-secondary)] ' +
	'uppercase tracking-[0.06em] mb-1.5 mt-3.5 first:mt-0';

const btnCls =
	'w-full mt-5 px-5 py-3 bg-teal-600 hover:bg-teal-500 ' +
	'text-white text-sm font-medium tracking-[0.01em] ' +
	'rounded-[var(--radius-md)] ' +
	'transition-[background-color,opacity] duration-200 ' +
	'disabled:opacity-40 disabled:cursor-not-allowed ' +
	'focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:outline-offset-2';

const hintCls = 'text-[11px] mt-1.5 flex items-center gap-1';

function isValidEmail(val) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export default function LoginPage() {
	const { login: authLogin } = useAuth();
	const [view, setView] = useState(VIEWS.LOGIN);
	const [form, setForm] = useState({
		email: '',
		password: '',
		username: '',
		role: 'member',
		code: '',
		newPassword: '',
	});
	const [touched, setTouched] = useState({});
	const [error, setError] = useState('');
	const [info, setInfo] = useState('');
	const [loading, setLoading] = useState(false);

	function handleChange(e) {
		setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
		setError('');
	}

	function handleBlur(e) {
		setTouched((t) => ({ ...t, [e.target.name]: true }));
	}

	function switchView(next) {
		setError('');
		setInfo('');
		setTouched({});
		setView(next);
	}

	const emailInvalid =
		touched.email && form.email.length > 0 && !isValidEmail(form.email);
	const passwordShort =
		touched.password && form.password.length > 0 && form.password.length < 6;
	const newPasswordShort =
		touched.newPassword &&
		form.newPassword.length > 0 &&
		form.newPassword.length < 6;

	async function handleLogin(e) {
		e.preventDefault();
		setTouched({ email: true, password: true });
		if (!isValidEmail(form.email)) return;
		setLoading(true);
		const res = await login(form.email, form.password);
		setLoading(false);
		if (res.token) {
			let userObj = res.user;
			if (!userObj.memberships) {
				const mem = await fetchMemberships(userObj.id);
				userObj.memberships = mem.memberships || [];
			}
			authLogin(userObj, res.token);
		} else {
			setError(res.message || 'Login failed');
		}
	}

	async function handleRegister(e) {
		e.preventDefault();
		setTouched({ email: true, password: true, username: true });
		if (!isValidEmail(form.email) || form.password.length < 6) return;
		setLoading(true);
		const res = await register(
			form.username,
			form.email,
			form.password,
			form.role,
			'',
		);
		setLoading(false);
		if (res.user) {
			setInfo('Account created! Please sign in.');
			setView(VIEWS.LOGIN);
		} else {
			setError(
				typeof res === 'string' ? res : res.message || 'Registration failed',
			);
		}
	}

	async function handleResetRequest(e) {
		e.preventDefault();
		setTouched({ email: true });
		if (!isValidEmail(form.email)) return;
		setLoading(true);
		const res = await requestPasswordReset(form.email);
		setLoading(false);
		setInfo(res.message || 'Check your email for a reset code.');
		setView(VIEWS.RESET_CONFIRM);
	}

	async function handleResetConfirm(e) {
		e.preventDefault();
		setTouched({ newPassword: true });
		if (form.newPassword.length < 6) return;
		setLoading(true);
		const res = await resetPassword(form.email, form.code, form.newPassword);
		setLoading(false);
		if (res.message === 'reset password done') {
			setInfo('Password reset! Please sign in.');
			setView(VIEWS.LOGIN);
		} else {
			setError(res.message || 'Reset failed');
		}
	}

	return (
		<div className='min-h-svh w-full flex items-center justify-center bg-[var(--bg-base)] relative overflow-hidden px-4'>
			<div
				aria-hidden='true'
				className='absolute w-[520px] h-[520px] rounded-full pointer-events-none'
				style={{
					background:
						'radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 70%)',
				}}
			/>

			<div className='relative w-full max-w-[420px] px-6 py-10 sm:px-10 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-md flex flex-col animate-[card-enter_0.4s_cubic-bezier(0.16,1,0.3,1)_both]'>
				<div className='flex items-baseline gap-0.5 mb-7' aria-label='Mizuka Connect'>
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
				<span></span>
				<span></span>
				<span></span>
					<span
						className='text-[32px] font-semibold text-teal-400 leading-none tracking-[-1.5px]'
						aria-hidden='true'
					>
						C
					</span>
					<span
						className='text-[26px] font-light text-[var(--text-primary)] tracking-[-0.5px]'
						aria-hidden='true'
					>
						onnect
					</span>
				</div>

				{info && (
					<p
						role='status'
						aria-live='polite'
						className='text-[13px] text-teal-400 bg-teal-500/[0.06] border border-teal-500/[0.15] rounded-[var(--radius-sm)] px-3 py-2.5 mb-4'
					>
						{info}
					</p>
				)}
				{error && (
					<p
						role='alert'
						aria-live='assertive'
						className='text-[13px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-[var(--radius-sm)] px-3 py-2.5 mb-4'
					>
						{error}
					</p>
				)}

				{view === VIEWS.LOGIN && (
					<form onSubmit={handleLogin} noValidate aria-label='Sign in form'>
						<h2 className='text-lg font-medium text-[var(--text-primary)] tracking-[-0.2px] mb-5'>
							Welcome back
						</h2>

						<label className={labelCls} htmlFor='login-email'>
							Email
						</label>
						<input
							id='login-email'
							className={inputCls(emailInvalid)}
							name='email'
							type='email'
							value={form.email}
							onChange={handleChange}
							onBlur={handleBlur}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									document.getElementById('login-password')?.focus();
								}
							}}
							required
							autoFocus
							autoComplete='email'
							aria-invalid={emailInvalid}
							aria-describedby={emailInvalid ? 'login-email-err' : undefined}
						/>
						{emailInvalid && (
							<p
								id='login-email-err'
								className={`${hintCls} text-red-400`}
								role='alert'
							>
								<svg
									width='11'
									height='11'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.5'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<circle cx='12' cy='12' r='10' />
									<line x1='12' y1='8' x2='12' y2='12' />
									<line x1='12' y1='16' x2='12.01' y2='16' />
								</svg>
								Enter a valid email address
							</p>
						)}

						<label className={labelCls} htmlFor='login-password'>
							Password
						</label>
						<input
							id='login-password'
							className={inputCls(false)}
							name='password'
							type='password'
							value={form.password}
							onChange={handleChange}
							onBlur={handleBlur}
							required
							autoComplete='current-password'
						/>

						<button
							className={btnCls}
							type='submit'
							disabled={loading || (touched.email && !isValidEmail(form.email))}
							aria-busy={loading}
						>
							{loading ? 'Signing in…' : 'Sign in'}
						</button>

						<div className='flex justify-center gap-5 mt-4'>
							<button
								type='button'
								className='text-[13px] text-[var(--text-muted)] hover:text-teal-400 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:rounded-sm'
								onClick={() => switchView(VIEWS.REGISTER)}
							>
								Create account
							</button>
							<button
								type='button'
								className='text-[13px] text-[var(--text-muted)] hover:text-teal-400 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:rounded-sm'
								onClick={() => switchView(VIEWS.RESET_REQ)}
							>
								Forgot password?
							</button>
						</div>
					</form>
				)}

				{view === VIEWS.REGISTER && (
					<form
						onSubmit={handleRegister}
						noValidate
						aria-label='Create account form'
					>
						<h2 className='text-lg font-medium text-[var(--text-primary)] tracking-[-0.2px] mb-2'>
							Create account
						</h2>
						<p className='text-[13px] text-[var(--text-muted)] mb-5 leading-relaxed'>
							You can join an institute after signing up.
						</p>

						<label className={labelCls} htmlFor='reg-username'>
							Username
						</label>
						<input
							id='reg-username'
							className={inputCls(false)}
							name='username'
							value={form.username}
							onChange={handleChange}
							onBlur={handleBlur}
							required
							autoFocus
							autoComplete='username'
						/>

						<label className={labelCls} htmlFor='reg-email'>
							Email
						</label>
						<input
							id='reg-email'
							className={inputCls(emailInvalid)}
							name='email'
							type='email'
							value={form.email}
							onChange={handleChange}
							onBlur={handleBlur}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									document.getElementById('reg-password')?.focus();
								}
							}}
							required
							autoComplete='email'
							aria-invalid={emailInvalid}
							aria-describedby={emailInvalid ? 'reg-email-err' : undefined}
						/>
						{emailInvalid && (
							<p
								id='reg-email-err'
								className={`${hintCls} text-red-400`}
								role='alert'
							>
								<svg
									width='11'
									height='11'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.5'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<circle cx='12' cy='12' r='10' />
									<line x1='12' y1='8' x2='12' y2='12' />
									<line x1='12' y1='16' x2='12.01' y2='16' />
								</svg>
								Enter a valid email address
							</p>
						)}

						<label className={labelCls} htmlFor='reg-password'>
							Password
						</label>
						<input
							id='reg-password'
							className={inputCls(passwordShort)}
							name='password'
							type='password'
							value={form.password}
							onChange={handleChange}
							onBlur={handleBlur}
							required
							autoComplete='new-password'
							aria-invalid={passwordShort}
							aria-describedby={
								passwordShort ? 'reg-password-err' : 'reg-password-hint'
							}
						/>
						{passwordShort ? (
							<p
								id='reg-password-err'
								className={`${hintCls} text-red-400`}
								role='alert'
							>
								<svg
									width='11'
									height='11'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.5'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<circle cx='12' cy='12' r='10' />
									<line x1='12' y1='8' x2='12' y2='12' />
									<line x1='12' y1='16' x2='12.01' y2='16' />
								</svg>
								Must be at least 6 characters
							</p>
						) : (
							<p
								id='reg-password-hint'
								className={`${hintCls} text-[var(--text-ghost)]`}
							>
								At least 6 characters
							</p>
						)}

						<label className={labelCls} htmlFor='reg-role'>
							Role
						</label>
						<select
							id='reg-role'
							name='role'
							value={form.role}
							onChange={handleChange}
							className={`${inputCls(false)} cursor-pointer pr-9`}
							style={{
								backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a8a83' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
								backgroundRepeat: 'no-repeat',
								backgroundPosition: 'right 12px center',
							}}
						>
							<option value='member'>Member</option>
							<option value='admin'>Admin</option>
						</select>

						<button
							className={btnCls}
							type='submit'
							disabled={
								loading ||
								(touched.email && !isValidEmail(form.email)) ||
								(touched.password && form.password.length < 6)
							}
							aria-busy={loading}
						>
							{loading ? 'Creating…' : 'Create account'}
						</button>

						<div className='flex justify-center mt-4'>
							<button
								type='button'
								className='text-[13px] text-[var(--text-muted)] hover:text-teal-400 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:rounded-sm'
								onClick={() => switchView(VIEWS.LOGIN)}
							>
								Back to sign in
							</button>
						</div>
					</form>
				)}

				{view === VIEWS.RESET_REQ && (
					<form
						onSubmit={handleResetRequest}
						noValidate
						aria-label='Reset password form'
					>
						<h2 className='text-lg font-medium text-[var(--text-primary)] tracking-[-0.2px] mb-2'>
							Reset password
						</h2>
						<p className='text-[13px] text-[var(--text-muted)] mb-5 leading-relaxed'>
							Enter your email and we'll send a reset code.
						</p>

						<label className={labelCls} htmlFor='reset-email'>
							Email
						</label>
						<input
							id='reset-email'
							className={inputCls(emailInvalid)}
							name='email'
							type='email'
							value={form.email}
							onChange={handleChange}
							onBlur={handleBlur}
							required
							autoFocus
							autoComplete='email'
							aria-invalid={emailInvalid}
							aria-describedby={emailInvalid ? 'reset-email-err' : undefined}
						/>
						{emailInvalid && (
							<p
								id='reset-email-err'
								className={`${hintCls} text-red-400`}
								role='alert'
							>
								<svg
									width='11'
									height='11'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.5'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<circle cx='12' cy='12' r='10' />
									<line x1='12' y1='8' x2='12' y2='12' />
									<line x1='12' y1='16' x2='12.01' y2='16' />
								</svg>
								Enter a valid email address
							</p>
						)}

						<button
							className={btnCls}
							type='submit'
							disabled={loading || (touched.email && !isValidEmail(form.email))}
							aria-busy={loading}
						>
							{loading ? 'Sending…' : 'Send reset code'}
						</button>

						<div className='flex justify-center mt-4'>
							<button
								type='button'
								className='text-[13px] text-[var(--text-muted)] hover:text-teal-400 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:rounded-sm'
								onClick={() => switchView(VIEWS.LOGIN)}
							>
								Back to sign in
							</button>
						</div>
					</form>
				)}

				{view === VIEWS.RESET_CONFIRM && (
					<form
						onSubmit={handleResetConfirm}
						noValidate
						aria-label='Enter reset code form'
					>
						<h2 className='text-lg font-medium text-[var(--text-primary)] tracking-[-0.2px] mb-2'>
							Enter reset code
						</h2>
						<p className='text-[13px] text-[var(--text-muted)] mb-5 leading-relaxed'>
							Check your email for a 6-digit code.
						</p>

						<label className={labelCls} htmlFor='reset-code'>
							Code
						</label>
						<input
							id='reset-code'
							className={inputCls(false)}
							name='code'
							value={form.code}
							onChange={handleChange}
							onBlur={handleBlur}
							required
							autoFocus
							inputMode='numeric'
							autoComplete='one-time-code'
						/>

						<label className={labelCls} htmlFor='reset-newpw'>
							New password
						</label>
						<input
							id='reset-newpw'
							className={inputCls(newPasswordShort)}
							name='newPassword'
							type='password'
							value={form.newPassword}
							onChange={handleChange}
							onBlur={handleBlur}
							required
							autoComplete='new-password'
							aria-invalid={newPasswordShort}
							aria-describedby={
								newPasswordShort ? 'reset-newpw-err' : 'reset-newpw-hint'
							}
						/>
						{newPasswordShort ? (
							<p
								id='reset-newpw-err'
								className={`${hintCls} text-red-400`}
								role='alert'
							>
								<svg
									width='11'
									height='11'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.5'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<circle cx='12' cy='12' r='10' />
									<line x1='12' y1='8' x2='12' y2='12' />
									<line x1='12' y1='16' x2='12.01' y2='16' />
								</svg>
								Must be at least 6 characters
							</p>
						) : (
							<p
								id='reset-newpw-hint'
								className={`${hintCls} text-[var(--text-ghost)]`}
							>
								At least 6 characters
							</p>
						)}

						<button
							className={btnCls}
							type='submit'
							disabled={
								loading || (touched.newPassword && form.newPassword.length < 6)
							}
							aria-busy={loading}
						>
							{loading ? 'Resetting…' : 'Reset password'}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
