import { Check, X, AlertCircle, Info } from 'lucide-react';
import './styles/Toast.css';

const ICONS = {
	success: <Check size={13} strokeWidth={3} aria-hidden='true' />,
	error: <X size={13} strokeWidth={3} aria-hidden='true' />,
	info: <Info size={13} strokeWidth={2} aria-hidden='true' />,
	warning: <AlertCircle size={13} strokeWidth={2} aria-hidden='true' />,
};

export default function Toast({ message, visible, type = 'success' }) {
	return (
		<div
			className={`toast toast--${type}${visible ? ' toast--visible' : ''}`}
			role='status'
			aria-live='polite'
			aria-atomic='true'
		>
			<span className='toast-icon'>{ICONS[type]}</span>
			{message}
		</div>
	);
}
