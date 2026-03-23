import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

function MessageInput({ onSend, onTyping, onStopTyping }) {
	const [text, setText] = useState('');
	const [isRecording, setIsRecording] = useState(false);

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

	useEffect(() => () => clearTimeout(typingTimer.current), []);

	const handleChange = (e) => {
		setText(e.target.value);
		if (!typingRef.current) {
			typingRef.current = true;
			onTyping?.();
		}
		clearTimeout(typingTimer.current);
		typingTimer.current = setTimeout(triggerStopTyping, 2000);
	};

	const handleSendText = useCallback(() => {
		const trimmed = text.trim();
		if (!trimmed) return;
		clearTimeout(typingTimer.current);
		triggerStopTyping();
		onSend(trimmed);
		setText('');
		textareaRef.current?.focus();
	}, [text, onSend, triggerStopTyping]);

	const handleCancelText = useCallback(() => {
		clearTimeout(typingTimer.current);
		triggerStopTyping();
		setText('');
		textareaRef.current?.focus();
	}, [triggerStopTyping]);

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendText();
		}
		if (e.key === 'Escape' && text.trim()) handleCancelText();
	};

	const handleAudioSent = useCallback(
		(url) => {
			onSend(url, 'audio');
			setIsRecording(false);
			setTimeout(() => textareaRef.current?.focus(), 50);
		},
		[onSend],
	);

	const handleRecorderCancel = useCallback(() => {
		setIsRecording(false);
		setTimeout(() => textareaRef.current?.focus(), 50);
	}, []);

	const hasText = text.trim().length > 0;

	const SendIcon = () => (
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
	);

	return (
		<section
			className='px-3.5 pt-2.5 pb-3 md:px-5 md:pt-3 md:pb-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-1.5 shrink-0'
			aria-label='Message composer'
		>
			<div
				className={`flex items-end gap-1.5 bg-[var(--bg-input)] border rounded-[var(--radius-lg)] pl-4 pr-1 py-1 transition-[border-color,box-shadow] duration-200 ${
					isRecording
						? 'border-[var(--teal-700)] shadow-[0_0_0_2px_rgba(13,148,136,0.06)]'
						: hasText
							? 'border-[var(--teal-700)] shadow-[0_0_0_2px_rgba(13,148,136,0.06)]'
							: 'border-[var(--border)] focus-within:border-[var(--teal-700)] focus-within:shadow-[0_0_0_2px_rgba(13,148,136,0.06)]'
				}`}
			>
				{isRecording ? (
					<AudioRecorder
						onAudioSent={handleAudioSent}
						onCancel={handleRecorderCancel}
					/>
				) : (
					<>
						<textarea
							ref={textareaRef}
							className='flex-1 bg-transparent outline-none text-[var(--text-primary)] text-[16px] md:text-sm leading-[1.6] resize-none max-h-[120px] overflow-y-auto py-2 font-[inherit] placeholder:text-[var(--text-ghost)]'
							value={text}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							placeholder='Message...'
							rows={1}
							aria-label='Type a message'
							aria-multiline='true'
						/>
						<div className='flex items-center gap-0.5 mb-[3px] shrink-0'>
							{hasText && (
								<button
									type='button'
									onClick={handleCancelText}
									className='w-7 h-7 min-w-[28px] rounded-[var(--radius-sm)] text-[var(--text-ghost)] flex items-center justify-center transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
									title='Clear message'
									aria-label='Clear message'
								>
									<X size={14} strokeWidth={2} />
								</button>
							)}
							{!hasText && (
								<button
									type='button'
									onClick={() => setIsRecording(true)}
									className='w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] transition-[background,color] duration-200 m-0.5 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:outline-offset-2'
									title='Record voice message'
									aria-label='Record a voice message'
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
										<path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' />
										<path d='M19 10v2a7 7 0 0 1-14 0v-2' />
										<line x1='12' y1='19' x2='12' y2='23' />
										<line x1='8' y1='23' x2='16' y2='23' />
									</svg>
								</button>
							)}
							<button
								type='button'
								onClick={handleSendText}
								disabled={!hasText}
								className={`w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center transition-[background,color] duration-200 m-0.5 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:outline-offset-2 ${
									hasText
										? 'bg-[var(--teal-600)] text-white hover:bg-[var(--teal-700)]'
										: 'bg-[var(--bg-surface)] text-[var(--text-ghost)] pointer-events-none'
								}`}
								title='Send message'
								aria-label='Send message'
								aria-disabled={!hasText}
							>
								<SendIcon />
							</button>
						</div>
					</>
				)}
			</div>

			{!isRecording && (
				<p
					className='hidden md:block text-[10px] text-[var(--text-ghost)] tracking-[0.01em] pl-1'
					aria-live='polite'
				>
					Enter to send · Shift+Enter for new line · Esc to clear
				</p>
			)}
		</section>
	);
}

export default MessageInput;
