import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

function MessageInput({ onSend, onTyping, onStopTyping }) {
	const [text, setText] = useState('');
	const typingRef = useRef(false);
	const typingTimer = useRef(null);
	const textareaRef = useRef(null);

	const triggerStopTyping = useCallback(() => {
		if (typingRef.current) {
			typingRef.current = false;
			onStopTyping?.();
		}
	}, [onStopTyping]);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = Math.min(el.scrollHeight, 120) + 'px';
	}, [text]);

	const handleChange = (e) => {
		setText(e.target.value);
		if (!typingRef.current) {
			typingRef.current = true;
			onTyping?.();
		}
		clearTimeout(typingTimer.current);
		typingTimer.current = setTimeout(triggerStopTyping, 2000);
	};

	const handleSend = useCallback(() => {
		const trimmed = text.trim();
		if (!trimmed) return;
		clearTimeout(typingTimer.current);
		triggerStopTyping();
		onSend(trimmed);
		setText('');
		textareaRef.current?.focus();
	}, [text, onSend, triggerStopTyping]);

	const handleCancel = useCallback(() => {
		clearTimeout(typingTimer.current);
		triggerStopTyping();
		setText('');
		textareaRef.current?.focus();
	}, [triggerStopTyping]);

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
		if (e.key === 'Escape' && text.trim()) handleCancel();
	};

	const hasText = text.trim().length > 0;

	return (
		<div
			className='px-3.5 pt-2.5 pb-3 md:px-5 md:pt-3 md:pb-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-1.5 shrink-0'
			role='form'
			aria-label='Send a message'
		>
			<div
				className={`flex items-end gap-1.5 bg-[var(--bg-input)] border rounded-[var(--radius-lg)] pl-4 pr-1 py-1 transition-[border-color,box-shadow] duration-200 focus-within:border-[var(--teal-700)] focus-within:shadow-[0_0_0_2px_rgba(13,148,136,0.06)] ${
					hasText
						? 'border-[var(--teal-700)] shadow-[0_0_0_2px_rgba(13,148,136,0.06)]'
						: 'border-[var(--border)]'
				}`}
			>
				<textarea
					ref={textareaRef}
					className='flex-1 bg-transparent outline-none text-[var(--text-primary)] text-[16px] md:text-sm leading-[1.6] resize-none max-h-[120px] overflow-y-auto py-2 font-[inherit] placeholder:text-[var(--text-ghost)]'
					value={text}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder='Message...'
					rows={1}
					aria-label='Message input'
					aria-multiline='true'
				/>

				{hasText && (
					<button
						className='w-7 h-7 min-w-[28px] rounded-[var(--radius-sm)] text-[var(--text-ghost)] flex items-center justify-center cursor-pointer transition-[background,color] duration-150 mb-[3px] shrink-0 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:outline-offset-[1px]'
						onClick={handleCancel}
						title='Clear message'
						aria-label='Clear message'
						type='button'
					>
						<X size={14} strokeWidth={2} />
					</button>
				)}

				<button
					className={`w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center transition-[background,color] duration-200 m-0.5 shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:outline-offset-2 ${
						hasText
							? 'bg-[var(--teal-600)] text-white hover:bg-[var(--teal-700)]'
							: 'bg-[var(--bg-surface)] text-[var(--text-ghost)] pointer-events-none'
					}`}
					onClick={handleSend}
					disabled={!hasText}
					title='Send message'
					aria-label='Send message'
					type='button'
				>
					<svg
						width='18'
						height='18'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
					>
						<line x1='22' y1='2' x2='11' y2='13' />
						<polygon points='22,2 15,22 11,13 2,9' />
					</svg>
				</button>
			</div>

			<p
				className='hidden md:block text-[10px] text-[var(--text-ghost)] tracking-[0.01em] pl-1'
				aria-live='polite'
			>
				Enter to send · Shift+Enter for new line · Esc to clear
			</p>
		</div>
	);
}

export default MessageInput;
