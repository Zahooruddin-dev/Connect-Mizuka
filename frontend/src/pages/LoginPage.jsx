import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import {
	login,
	register,
	requestPasswordReset,
	resetPassword,
	fetchMemberships,
} from '../services/api';
import '../styles/LoginPage.css';

const VIEWS = {
	LOGIN: 'login',
	REGISTER: 'register',
	RESET_REQ: 'reset_req',
	RESET_CONFIRM: 'reset_confirm',
};

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
	const [error, setError] = useState('');
	const [info, setInfo] = useState('');
	const [loading, setLoading] = useState(false);

	function handleChange(e) {
		setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
		setError('');
	}

	async function handleLogin(e) {
		e.preventDefault();
		setLoading(true);
		const res = await login(form.email, form.password);
		setLoading(false);
		if (res.token) {
			// if server didn't include memberships, fetch separately
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
		setLoading(true);
		const res = await requestPasswordReset(form.email);
		setLoading(false);
		setInfo(res.message || 'Check your email for a reset code.');
		setView(VIEWS.RESET_CONFIRM);
	}

	async function handleResetConfirm(e) {
		e.preventDefault();
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

	function switchView(next) {
		setError('');
		setInfo('');
		setView(next);
	}

	return (
		<div className='login-shell'>
			<div className='login-card'>
				<div className='login-brand'>
					<span className='login-logo'>M</span>
					<span className='login-name'>izuka</span>
				</div>

				{info && (
					<p className='login-info' role='status'>
						{info}
					</p>
				)}
				{error && (
					<p className='login-error' role='alert'>
						{error}
					</p>
				)}

				{view === VIEWS.LOGIN && (
					<form className='login-form' onSubmit={handleLogin} noValidate>
						<h2 className='login-heading'>Welcome back</h2>
						<label className='login-label' htmlFor='login-email'>
							Email
						</label>
						<input
							id='login-email'
							className='login-input'
							name='email'
							type='email'
							value={form.email}
							onChange={handleChange}
							required
							autoFocus
							autoComplete='email'
						/>
						<label className='login-label' htmlFor='login-password'>
							Password
						</label>
						<input
							id='login-password'
							className='login-input'
							name='password'
							type='password'
							value={form.password}
							onChange={handleChange}
							required
							autoComplete='current-password'
						/>
						<button className='login-btn' type='submit' disabled={loading}>
							{loading ? 'Signing in…' : 'Sign in'}
						</button>
						<div className='login-links'>
							<button
								type='button'
								className='login-link'
								onClick={() => switchView(VIEWS.REGISTER)}
							>
								Create account
							</button>
							<button
								type='button'
								className='login-link'
								onClick={() => switchView(VIEWS.RESET_REQ)}
							>
								Forgot password?
							</button>
						</div>
					</form>
				)}

				{view === VIEWS.REGISTER && (
					<form className='login-form' onSubmit={handleRegister} noValidate>
						<h2 className='login-heading'>Create account</h2>
						<p className='login-sub'>
							You can join an institute after signing up.
						</p>
						<label className='login-label' htmlFor='reg-username'>
							Username
						</label>
						<input
							id='reg-username'
							className='login-input'
							name='username'
							value={form.username}
							onChange={handleChange}
							required
							autoFocus
							autoComplete='username'
						/>
						<label className='login-label' htmlFor='reg-email'>
							Email
						</label>
						<input
							id='reg-email'
							className='login-input'
							name='email'
							type='email'
							value={form.email}
							onChange={handleChange}
							required
							autoComplete='email'
						/>
						<label className='login-label' htmlFor='reg-password'>
							Password
						</label>
						<input
							id='reg-password'
							className='login-input'
							name='password'
							type='password'
							value={form.password}
							onChange={handleChange}
							required
							autoComplete='new-password'
						/>
						<label className='login-label' htmlFor='reg-role'>
							Role
						</label>
						<select
							id='reg-role'
							className='login-input login-select'
							name='role'
							value={form.role}
							onChange={handleChange}
						>
							<option value='member'>Member</option>
							<option value='admin'>Admin</option>
						</select>
						<button className='login-btn' type='submit' disabled={loading}>
							{loading ? 'Creating…' : 'Create account'}
						</button>
						<div className='login-links'>
							<button
								type='button'
								className='login-link'
								onClick={() => switchView(VIEWS.LOGIN)}
							>
								Back to sign in
							</button>
						</div>
					</form>
				)}

				{view === VIEWS.RESET_REQ && (
					<form className='login-form' onSubmit={handleResetRequest} noValidate>
						<h2 className='login-heading'>Reset password</h2>
						<p className='login-sub'>
							Enter your email and we'll send a reset code.
						</p>
						<label className='login-label' htmlFor='reset-email'>
							Email
						</label>
						<input
							id='reset-email'
							className='login-input'
							name='email'
							type='email'
							value={form.email}
							onChange={handleChange}
							required
							autoFocus
							autoComplete='email'
						/>
						<button className='login-btn' type='submit' disabled={loading}>
							{loading ? 'Sending…' : 'Send reset code'}
						</button>
						<div className='login-links'>
							<button
								type='button'
								className='login-link'
								onClick={() => switchView(VIEWS.LOGIN)}
							>
								Back to sign in
							</button>
						</div>
					</form>
				)}

				{view === VIEWS.RESET_CONFIRM && (
					<form className='login-form' onSubmit={handleResetConfirm} noValidate>
						<h2 className='login-heading'>Enter reset code</h2>
						<p className='login-sub'>Check your email for a 6-digit code.</p>
						<label className='login-label' htmlFor='reset-code'>
							Code
						</label>
						<input
							id='reset-code'
							className='login-input'
							name='code'
							value={form.code}
							onChange={handleChange}
							required
							autoFocus
							inputMode='numeric'
							autoComplete='one-time-code'
						/>
						<label className='login-label' htmlFor='reset-newpw'>
							New password
						</label>
						<input
							id='reset-newpw'
							className='login-input'
							name='newPassword'
							type='password'
							value={form.newPassword}
							onChange={handleChange}
							required
							autoComplete='new-password'
						/>
						<button className='login-btn' type='submit' disabled={loading}>
							{loading ? 'Resetting…' : 'Reset password'}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
