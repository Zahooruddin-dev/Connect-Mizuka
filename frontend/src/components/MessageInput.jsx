import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import './styles/MessageInput.css';

function MessageInput({ onSend, onTyping, onStopTyping }) {
	const [text, setText] = useState('');
	const typingRef  = useRef(false);
	const typingTimer = useRef(null);
	const textareaRef = useRef(null);

	const triggerStopTyping = useCallback(() => {
		if (typingRef.current) {
			typingRef.current = false;
			onStopTyping?.();
		}
	}, [onStopTyping]);

	// Auto-resize textarea height as content grows
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
		if (e.key === 'Escape' && text.trim()) {
			handleCancel();
		}
	};

	const hasText = text.trim().length > 0;

	return (
		<div className='message-input-bar' role='form' aria-label='Send a message'>
			<div className={`message-input-wrap${hasText ? ' message-input-wrap--active' : ''}`}>
				<textarea
					ref={textareaRef}
					className='message-input'
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
						className='message-cancel-btn'
						onClick={handleCancel}
						title='Clear message'
						aria-label='Clear message'
						type='button'
						tabIndex={0}
					>
						<X size={14} strokeWidth={2} />
					</button>
				)}

				<button
					className={`message-send-btn${hasText ? ' active' : ''}`}
					onClick={handleSend}
					disabled={!hasText}
					title='Send message'
					aria-label='Send message'
					type='button'
				>
					<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<line x1='22' y1='2' x2='11' y2='13' />
						<polygon points='22,2 15,22 11,13 2,9' />
					</svg>
				</button>
			</div>
			<p className='message-input-hint' aria-live='polite'>
				Enter to send · Shift+Enter for new line · Esc to clear
			</p>
		</div>
	);
}

export default MessageInput;