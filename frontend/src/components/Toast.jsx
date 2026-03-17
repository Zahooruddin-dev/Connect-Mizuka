import { Check, X, AlertCircle, Info } from 'lucide-react';

const ICONS = {
	success: <Check size={13} strokeWidth={3} aria-hidden="true" />,
	error:   <X size={13} strokeWidth={3} aria-hidden="true" />,
	info:    <Info size={13} strokeWidth={2} aria-hidden="true" />,
	warning: <AlertCircle size={13} strokeWidth={2} aria-hidden="true" />,
};

const STYLES = {
	success: { wrap: 'bg-[#14532d] border-[#166534] text-[#bbf7d0]', icon: 'text-[#86efac]' },
	error:   { wrap: 'bg-[#450a0a] border-[#7f1d1d] text-[#fecaca]', icon: 'text-[#fca5a5]' },
	info:    { wrap: 'bg-[#0f2744] border-[#1e3a5f] text-[#bfdbfe]', icon: 'text-[#93c5fd]' },
	warning: { wrap: 'bg-[#431407] border-[#78350f] text-[#fde68a]', icon: 'text-[#fcd34d]' },
};

export default function Toast({ message, visible, type = 'success' }) {
	const s = STYLES[type] || STYLES.success;
	return (
		<div
			className={`fixed bottom-7 left-1/2 z-[1600] flex items-center gap-[7px] px-4 py-[9px] pl-3 rounded-full text-[13px] font-medium whitespace-nowrap pointer-events-none border shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${s.wrap} ${
				visible
					? 'opacity-100 -translate-x-1/2 translate-y-0'
					: 'opacity-0 -translate-x-1/2 translate-y-2.5'
			}`}
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<span className={`flex items-center shrink-0 ${s.icon}`}>{ICONS[type]}</span>
			{message}
		</div>
	);
}