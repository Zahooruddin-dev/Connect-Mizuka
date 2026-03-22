import { useState, useRef, useCallback, useEffect } from 'react';
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

export default function VoiceRecorder({ onAudioReady, disabled }) {
	const [state, setState] = useState('idle');
	const [duration, setDuration] = useState(0);
	const [errorMsg, setErrorMsg] = useState('');
	const [audioBlob, setAudioBlob] = useState(null);
	const [audioUrl, setAudioUrl] = useState('');

	const mediaRecorderRef = useRef(null);
	const chunksRef = useRef([]);
	const timerRef = useRef(null);
	const streamRef = useRef(null);

	useEffect(() => {
		return () => {
			clearInterval(timerRef.current);
			stopStream();
		};
	}, []);

	function stopStream() {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
	}

	const startRecording = useCallback(async () => {
		setErrorMsg('');
		setState('requesting');
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
				setState('recorded');
				stopStream();
			};

			mr.start(100);
			setState('recording');
			setDuration(0);
			timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
		} catch (err) {
			stopStream();
			setState('error');
			if (
				err.name === 'NotAllowedError' ||
				err.name === 'PermissionDeniedError'
			) {
				setErrorMsg('Microphone access denied. Allow it in browser settings.');
			} else if (err.name === 'NotFoundError') {
				setErrorMsg('No microphone found on this device.');
			} else {
				setErrorMsg('Could not start recording.');
			}
		}
	}, []);

	const stopRecording = useCallback(() => {
		clearInterval(timerRef.current);
		mediaRecorderRef.current?.stop();
	}, []);

	const cancelRecording = useCallback(() => {
		clearInterval(timerRef.current);
		mediaRecorderRef.current?.stop();
		stopStream();
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		setAudioBlob(null);
		setAudioUrl('');
		setDuration(0);
		setState('idle');
	}, [audioUrl]);

	const sendAudio = useCallback(async () => {
		if (!audioBlob) return;
		setState('uploading');
		try {
			const form = new FormData();
			const ext = audioBlob.type.includes('ogg')
				? 'ogg'
				: audioBlob.type.includes('mp4')
					? 'm4a'
					: 'webm';
			form.append('audio', audioBlob, `voice-message.${ext}`);

			const res = await api.post('/messages/upload-audio', form, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			if (res.data?.url) {
				onAudioReady(res.data.url);
				URL.revokeObjectURL(audioUrl);
				setAudioBlob(null);
				setAudioUrl('');
				setDuration(0);
				setState('idle');
			} else {
				setErrorMsg('Upload failed. Please try again.');
				setState('recorded');
			}
		} catch {
			setErrorMsg('Upload failed. Please try again.');
			setState('recorded');
		}
	}, [audioBlob, audioUrl, onAudioReady]);

	function formatDur(s) {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, '0')}`;
	}

	if (state === 'idle') {
		return (
			<button
				type='button'
				onClick={startRecording}
				disabled={disabled}
				title='Record voice message'
				aria-label='Record voice message'
				className='w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-ghost)] transition-[background,color] duration-200 hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
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
		);
	}

	if (state === 'requesting') {
		return (
			<div className='flex items-center gap-1.5 px-2 text-[12px] text-[var(--text-ghost)]'>
				<span className='animate-pulse'>Waiting for mic…</span>
			</div>
		);
	}

	if (state === 'recording') {
		return (
			<div className='flex items-center gap-2'>
				<span
					className='w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0'
					aria-hidden='true'
				/>
				<span className='text-[12px] font-mono text-[var(--text-muted)] tabular-nums min-w-[36px]'>
					{formatDur(duration)}
				</span>
				<button
					type='button'
					onClick={stopRecording}
					title='Stop recording'
					aria-label='Stop recording'
					className='w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-red-500'
				>
					<svg
						width='12'
						height='12'
						viewBox='0 0 24 24'
						fill='currentColor'
						aria-hidden='true'
					>
						<rect x='4' y='4' width='16' height='16' rx='2' />
					</svg>
				</button>
				<button
					type='button'
					onClick={cancelRecording}
					title='Cancel'
					aria-label='Cancel recording'
					className='w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
				>
					<svg
						width='12'
						height='12'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
						aria-hidden='true'
					>
						<line x1='18' y1='6' x2='6' y2='18' />
						<line x1='6' y1='6' x2='18' y2='18' />
					</svg>
				</button>
			</div>
		);
	}

	if (state === 'recorded') {
		return (
			<div className='flex items-center gap-2'>
				<audio
					src={audioUrl}
					controls
					className='h-8 max-w-[160px] md:max-w-[220px]'
				/>
				<button
					type='button'
					onClick={sendAudio}
					title='Send voice message'
					aria-label='Send voice message'
					className='w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--teal-600)] text-white hover:bg-[var(--teal-700)] transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] shrink-0'
				>
					<svg
						width='13'
						height='13'
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
				<button
					type='button'
					onClick={cancelRecording}
					title='Discard'
					aria-label='Discard recording'
					className='w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] shrink-0'
				>
					<svg
						width='12'
						height='12'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
						aria-hidden='true'
					>
						<line x1='18' y1='6' x2='6' y2='18' />
						<line x1='6' y1='6' x2='18' y2='18' />
					</svg>
				</button>
			</div>
		);
	}

	if (state === 'uploading') {
		return (
			<div className='flex items-center gap-1.5 px-2 text-[12px] text-[var(--text-ghost)]'>
				<span className='animate-pulse'>Sending…</span>
			</div>
		);
	}

	if (state === 'error') {
		return (
			<div className='flex items-center gap-2'>
				<span className='text-[11px] text-red-400 max-w-[180px] leading-tight'>
					{errorMsg}
				</span>
				<button
					type='button'
					onClick={() => setState('idle')}
					className='text-[11px] text-[var(--text-ghost)] underline hover:text-[var(--text-muted)]'
				>
					Dismiss
				</button>
			</div>
		);
	}

	return null;
}
