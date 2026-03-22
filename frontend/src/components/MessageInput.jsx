import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

function getSupportedMimeType() {
	const types = [
		'audio/webm;codecs=opus',
		'audio/webm',
		'audio/ogg;codecs=opus',
		'audio/mp4',
	];
	return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function formatDur(s) {
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function MessageInput({ onSend, onTyping, onStopTyping }) {
	const [text, setText] = useState('');
	const [recState, setRecState] = useState('idle');
	const [duration, setDuration] = useState(0);
	const [audioBlob, setAudioBlob] = useState(null);
	const [audioUrl, setAudioUrl] = useState('');
	const [recError, setRecError] = useState('');

	const typingRef = useRef(false);
	const typingTimer = useRef(null);
	const textareaRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const chunksRef = useRef([]);
	const timerRef = useRef(null);
	const streamRef = useRef(null);

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

	useEffect(() => {
		return () => {
			clearInterval(timerRef.current);
			clearTimeout(typingTimer.current);
			streamRef.current?.getTracks().forEach((t) => t.stop());
			if (audioUrl) URL.revokeObjectURL(audioUrl);
		};
	}, []);

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

	const startRecording = useCallback(async () => {
		setRecError('');
		setRecState('requesting');
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			const mimeType = getSupportedMimeType();
			const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
			mediaRecorderRef.current = mr;
			chunksRef.current = [];
			mr.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};
			mr.onstop = () => {
				const blob = new Blob(chunksRef.current, {
					type: mimeType || 'audio/webm',
				});
				const url = URL.createObjectURL(blob);
				setAudioBlob(blob);
				setAudioUrl(url);
				setRecState('preview');
				streamRef.current?.getTracks().forEach((t) => t.stop());
				streamRef.current = null;
			};
			mr.start(100);
			setRecState('recording');
			setDuration(0);
			timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
		} catch (err) {
			streamRef.current?.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
			if (
				err.name === 'NotAllowedError' ||
				err.name === 'PermissionDeniedError'
			) {
				setRecError('Mic access denied. Allow it in browser settings.');
			} else if (err.name === 'NotFoundError') {
				setRecError('No microphone found.');
			} else {
				setRecError('Could not start recording.');
			}
			setRecState('idle');
		}
	}, []);

	const stopRecording = useCallback(() => {
		clearInterval(timerRef.current);
		mediaRecorderRef.current?.stop();
	}, []);

	const discardRecording = useCallback(() => {
		clearInterval(timerRef.current);
		if (mediaRecorderRef.current?.state === 'recording') {
			mediaRecorderRef.current.stop();
		}
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		setAudioBlob(null);
		setAudioUrl('');
		setDuration(0);
		setRecState('idle');
		textareaRef.current?.focus();
	}, [audioUrl]);

	const sendAudio = useCallback(async () => {
		if (!audioBlob) return;
		setRecState('uploading');
		try {
			const form = new FormData();
			const ext = audioBlob.type.includes('ogg')
				? 'ogg'
				: audioBlob.type.includes('mp4')
					? 'm4a'
					: 'webm';
			form.append('audio', audioBlob, `voice.${ext}`);
			const res = await api.post('/messages/upload-audio', form, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			if (res.data?.url) {
				onSend(res.data.url, 'audio');
				URL.revokeObjectURL(audioUrl);
				setAudioBlob(null);
				setAudioUrl('');
				setDuration(0);
				setRecState('idle');
				textareaRef.current?.focus();
			} else {
				setRecError('Upload failed. Try again.');
				setRecState('preview');
			}
		} catch {
			setRecError('Upload failed. Try again.');
			setRecState('preview');
		}
	}, [audioBlob, audioUrl, onSend]);

	const hasText = text.trim().length > 0;
	const isRecording = recState === 'recording';
	const isPreview = recState === 'preview';
	const isUploading = recState === 'uploading';
	const isRequesting = recState === 'requesting';
	const isIdle = recState === 'idle';

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

	const MicIcon = () => (
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
	);

	return (
		<div
			className='px-3.5 pt-2.5 pb-3 md:px-5 md:pt-3 md:pb-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-1.5 shrink-0'
			role='form'
			aria-label='Send a message'
		>
			{recError && (
				<div className='flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20'>
					<span className='text-[11px] text-red-400 leading-tight'>
						{recError}
					</span>
					<button
						type='button'
						onClick={() => setRecError('')}
						className='text-red-400 hover:text-red-300 shrink-0'
						aria-label='Dismiss error'
					>
						<X size={13} strokeWidth={2} />
					</button>
				</div>
			)}

			{(isPreview || isUploading) && (
				<div className='flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--teal-700)] shadow-[0_0_0_2px_rgba(13,148,136,0.06)] rounded-[var(--radius-lg)] px-3 py-2'>
					<button
						type='button'
						onClick={discardRecording}
						className='w-7 h-7 min-w-[28px] rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] transition-[background,color] duration-150 shrink-0'
						aria-label='Discard recording'
						title='Discard'
					>
						<X size={14} strokeWidth={2} />
					</button>
					<audio
						src={audioUrl}
						controls
						preload='metadata'
						className='flex-1 h-9 min-w-0'
						aria-label='Recording preview'
					/>
					<button
						type='button'
						onClick={sendAudio}
						disabled={isUploading}
						className='w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--teal-600)] text-white hover:bg-[var(--teal-700)] transition-[background] duration-200 disabled:opacity-60 disabled:cursor-not-allowed shrink-0'
						aria-label={isUploading ? 'Sending…' : 'Send voice message'}
						title={isUploading ? 'Sending…' : 'Send'}
					>
						{isUploading ? (
							<svg
								className='animate-spin'
								width='16'
								height='16'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								aria-hidden='true'
							>
								<path d='M21 12a9 9 0 1 1-6.219-8.56' />
							</svg>
						) : (
							<SendIcon />
						)}
					</button>
				</div>
			)}

			<div
				className={`flex items-end gap-1.5 bg-[var(--bg-input)] border rounded-[var(--radius-lg)] pl-4 pr-1 py-1 transition-[border-color,box-shadow] duration-200 ${
					isRecording
						? 'border-red-500/60 shadow-[0_0_0_2px_rgba(239,68,68,0.08)]'
						: hasText
							? 'border-[var(--teal-700)] shadow-[0_0_0_2px_rgba(13,148,136,0.06)]'
							: 'border-[var(--border)] focus-within:border-[var(--teal-700)] focus-within:shadow-[0_0_0_2px_rgba(13,148,136,0.06)]'
				}`}
			>
				{isRecording ? (
					<div className='flex-1 flex items-center gap-2.5 py-2 min-w-0'>
						<span
							className='w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0'
							aria-hidden='true'
						/>
						<span className='text-[12px] font-mono text-[var(--text-muted)] tabular-nums'>
							{formatDur(duration)}
						</span>
						<span className='text-[12px] text-[var(--text-ghost)] italic truncate'>
							Recording…
						</span>
					</div>
				) : isRequesting ? (
					<div className='flex-1 flex items-center py-2'>
						<span className='text-[12px] text-[var(--text-ghost)] animate-pulse'>
							Waiting for mic…
						</span>
					</div>
				) : (
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
				)}

				<div className='flex items-center gap-0.5 mb-[3px] shrink-0'>
					{hasText && isIdle && (
						<button
							type='button'
							onClick={handleCancelText}
							className='w-7 h-7 min-w-[28px] rounded-[var(--radius-sm)] text-[var(--text-ghost)] flex items-center justify-center transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]'
							title='Clear'
							aria-label='Clear message'
						>
							<X size={14} strokeWidth={2} />
						</button>
					)}

					{isIdle && (
						<button
							type='button'
							onClick={startRecording}
							className='w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] transition-[background,color] duration-200 m-0.5'
							title='Record voice message'
							aria-label='Record voice message'
						>
							<MicIcon />
						</button>
					)}

					{isRecording && (
						<button
							type='button'
							onClick={stopRecording}
							className='w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-[background] duration-200 m-0.5'
							title='Stop recording'
							aria-label='Stop recording'
						>
							<svg
								width='14'
								height='14'
								viewBox='0 0 24 24'
								fill='currentColor'
								aria-hidden='true'
							>
								<rect x='4' y='4' width='16' height='16' rx='2' />
							</svg>
						</button>
					)}

					{isIdle && (
						<button
							type='button'
							onClick={handleSendText}
							disabled={!hasText}
							className={`w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center transition-[background,color] duration-200 m-0.5 ${
								hasText
									? 'bg-[var(--teal-600)] text-white hover:bg-[var(--teal-700)]'
									: 'bg-[var(--bg-surface)] text-[var(--text-ghost)] pointer-events-none'
							}`}
							title='Send'
							aria-label='Send message'
						>
							<SendIcon />
						</button>
					)}
				</div>
			</div>

			<p
				className='hidden md:block text-[10px] text-[var(--text-ghost)] tracking-[0.01em] pl-1'
				aria-live='polite'
			>
				{isRecording
					? 'Stop to preview your recording'
					: 'Enter to send · Shift+Enter for new line · Esc to clear'}
			</p>
		</div>
	);
}

export default MessageInput;
