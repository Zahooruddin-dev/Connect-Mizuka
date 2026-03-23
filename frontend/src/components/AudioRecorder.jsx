import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

function getSupportedMimeType() {
	const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
	return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function formatDur(s) {
	if (!s || !isFinite(s) || isNaN(s)) return '0:00';
	const secs = Math.floor(s);
	return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function AudioPreviewPlayer({ src }) {
	const [playing, setPlaying] = useState(false);
	const [current, setCurrent] = useState(0);
	const [total, setTotal] = useState(0);
	const audioRef = useRef(null);

	useEffect(() => {
		const el = audioRef.current;
		if (!el) return;
		const onLoaded = () => setTotal(el.duration || 0);
		const onTime   = () => setCurrent(el.currentTime);
		const onEnded  = () => setPlaying(false);
		el.addEventListener('loadedmetadata', onLoaded);
		el.addEventListener('timeupdate', onTime);
		el.addEventListener('ended', onEnded);
		return () => {
			el.removeEventListener('loadedmetadata', onLoaded);
			el.removeEventListener('timeupdate', onTime);
			el.removeEventListener('ended', onEnded);
		};
	}, [src]);

	const toggle = () => {
		const el = audioRef.current;
		if (!el) return;
		if (playing) { el.pause(); setPlaying(false); }
		else         { el.play(); setPlaying(true); }
	};

	const seek = (e) => {
		const el = audioRef.current;
		if (!el || !total) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		el.currentTime = ratio * total;
	};

	const pct = total > 0 ? (current / total) * 100 : 0;

	return (
		<div className='flex-1 flex items-center gap-2 min-w-0' aria-label='Voice message preview'>
			<audio ref={audioRef} src={src} preload='metadata' className='hidden' aria-hidden='true' />
			<button
				type='button'
				onClick={toggle}
				aria-label={playing ? 'Pause preview' : 'Play preview'}
				className='w-7 h-7 min-w-[28px] rounded-full flex items-center justify-center bg-[var(--teal-700)] text-white hover:bg-[var(--teal-600)] transition-[background] duration-150 shrink-0'
			>
				{playing ? (
					<svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
						<rect x='6' y='4' width='4' height='16' rx='1' />
						<rect x='14' y='4' width='4' height='16' rx='1' />
					</svg>
				) : (
					<svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
						<polygon points='5,3 19,12 5,21' />
					</svg>
				)}
			</button>
			<div
				className='flex-1 h-1.5 rounded-full bg-[var(--bg-hover)] cursor-pointer relative overflow-hidden'
				onClick={seek}
				role='slider'
				aria-label='Seek'
				aria-valuenow={Math.round(current)}
				aria-valuemin={0}
				aria-valuemax={Math.round(total)}
			>
				<div
					className='absolute inset-y-0 left-0 rounded-full bg-[var(--teal-600)] transition-[width] duration-100'
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className='text-[10px] font-mono text-[var(--text-ghost)] tabular-nums shrink-0 min-w-[32px] text-right'>
				{formatDur(playing ? current : (isFinite(total) ? total : 0))}
			</span>
		</div>
	);
}

export default function AudioRecorder({ onAudioSent, onCancel }) {
	const [state, setState] = useState('requesting');
	const startedRef = useRef(false);
	const [duration, setDuration] = useState(0);
	const [audioBlob, setAudioBlob] = useState(null);
	const [audioUrl, setAudioUrl] = useState('');
	const [error, setError] = useState('');

	const mediaRecorderRef = useRef(null);
	const chunksRef        = useRef([]);
	const timerRef         = useRef(null);
	const streamRef        = useRef(null);

	useEffect(() => {
		return () => {
			clearInterval(timerRef.current);
			streamRef.current?.getTracks().forEach((t) => t.stop());
			if (audioUrl) URL.revokeObjectURL(audioUrl);
		};
	}, []);

	const start = useCallback(async () => {
		setError('');
		setState('requesting');
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			const mimeType = getSupportedMimeType();
			const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
			mediaRecorderRef.current = mr;
			chunksRef.current = [];
			mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
			mr.onstop = () => {
				const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
				const url  = URL.createObjectURL(blob);
				setAudioBlob(blob);
				setAudioUrl(url);
				setState('preview');
				streamRef.current?.getTracks().forEach((t) => t.stop());
				streamRef.current = null;
			};
			mr.start(100);
			setState('recording');
			setDuration(0);
			timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
		} catch (err) {
			streamRef.current?.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
			setError(
				err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
					? 'Mic access denied. Allow it in browser settings.'
					: err.name === 'NotFoundError'
					? 'No microphone found on this device.'
					: 'Could not start recording.',
			);
			setState('idle');
		}
	}, []);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;
		start();
	}, []);

	const stop = useCallback(() => {
		clearInterval(timerRef.current);
		mediaRecorderRef.current?.stop();
	}, []);

	const discard = useCallback(() => {
		clearInterval(timerRef.current);
		if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		setAudioBlob(null);
		setAudioUrl('');
		setDuration(0);
		setError('');
		setState('idle');
		onCancel?.();
	}, [audioUrl, onCancel]);

	const send = useCallback(async () => {
		if (!audioBlob) return;
		setState('uploading');
		setError('');
		try {
			const form = new FormData();
			const ext = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
			form.append('audio', audioBlob, `voice.${ext}`);
			const res = await api.post('/messages/upload-audio', form, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			if (res.data?.url) {
				URL.revokeObjectURL(audioUrl);
				setAudioBlob(null);
				setAudioUrl('');
				setDuration(0);
				setState('idle');
				onAudioSent(res.data.url);
			} else {
				setError('Upload failed. Try again.');
				setState('preview');
			}
		} catch {
			setError('Upload failed. Try again.');
			setState('preview');
		}
	}, [audioBlob, audioUrl, onAudioSent]);

	const SendIcon = () => (
		<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
			<line x1='22' y1='2' x2='11' y2='13' />
			<polygon points='22,2 15,22 11,13 2,9' />
		</svg>
	);

	if (state === 'requesting') {
		return (
			<span className='flex-1 text-[12px] text-[var(--text-ghost)] animate-pulse py-2' role='status' aria-live='polite'>
				Waiting for mic…
			</span>
		);
	}

	if (state === 'recording') {
		return (
			<>
				<div className='flex-1 flex items-center gap-2.5 py-2 min-w-0' role='status' aria-live='polite' aria-label={`Recording — ${formatDur(duration)}`}>
					<span className='w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0' aria-hidden='true' />
					<span className='text-[12px] font-mono text-[var(--text-muted)] tabular-nums' aria-hidden='true'>{formatDur(duration)}</span>
					<span className='text-[12px] text-[var(--text-ghost)] italic truncate' aria-hidden='true'>Recording…</span>
				</div>
				<div className='flex items-center gap-0.5 shrink-0'>
					<button
						type='button'
						onClick={discard}
						className='w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
						aria-label='Cancel recording'
						title='Cancel'
					>
						<X size={14} strokeWidth={2} />
					</button>
					<button
						type='button'
						onClick={stop}
						className='w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-[background] duration-200 m-0.5 focus-visible:outline-2 focus-visible:outline-red-500'
						aria-label='Stop recording'
						title='Stop'
					>
						<svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
							<rect x='4' y='4' width='16' height='16' rx='2' />
						</svg>
					</button>
				</div>
			</>
		);
	}

	if (state === 'preview' || state === 'uploading') {
		return (
			<>
				{error ? (
					<span className='flex-1 text-[11px] text-red-400 truncate' role='alert'>{error}</span>
				) : (
					<AudioPreviewPlayer src={audioUrl} />
				)}
				<div className='flex items-center gap-0.5 shrink-0'>
					<button
						type='button'
						onClick={discard}
						className='w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
						aria-label='Discard recording'
						title='Discard'
					>
						<X size={14} strokeWidth={2} />
					</button>
					<button
						type='button'
						onClick={send}
						disabled={state === 'uploading'}
						className='w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--teal-600)] text-white hover:bg-[var(--teal-700)] transition-[background] duration-200 m-0.5 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
						aria-label={state === 'uploading' ? 'Sending voice message…' : 'Send voice message'}
						title={state === 'uploading' ? 'Sending…' : 'Send'}
					>
						{state === 'uploading' ? (
							<svg className='animate-spin' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' aria-hidden='true'>
								<path d='M21 12a9 9 0 1 1-6.219-8.56' />
							</svg>
						) : (
							<SendIcon />
						)}
					</button>
				</div>
			</>
		);
	}

	return null;
}