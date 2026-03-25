import { useState, useRef, useEffect } from 'react';

const SPEEDS = [0.5, 1, 1.5, 2];

export default function AudioPlayer({ src, isMine, compact = false }) {
	const audioRef = useRef(null);
	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [muted, setMuted] = useState(false);
	const [speedIdx, setSpeedIdx] = useState(1);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const el = audioRef.current;
		if (!el) return;

		const onLoaded = () => {
			if (el.duration === Infinity || isNaN(el.duration)) {
				el.currentTime = 1e10;
			} else {
				setDuration(el.duration);
				setLoaded(true);
			}
		};

		const onTime = () => {
			if (el.duration === Infinity || isNaN(el.duration)) {
				if (el.currentTime > 0 && el.buffered.length > 0) el.currentTime = 0;
				return;
			}
			if (!loaded) { setDuration(el.duration); setLoaded(true); }
			setCurrentTime(el.currentTime);
			setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
		};

		const onDurationChange = () => {
			if (el.duration && el.duration !== Infinity && !isNaN(el.duration)) {
				setDuration(el.duration);
				setLoaded(true);
				el.currentTime = 0;
			}
		};

		const onEnded = () => {
			setPlaying(false);
			setProgress(0);
			setCurrentTime(0);
			el.currentTime = 0;
		};

		el.addEventListener('loadedmetadata', onLoaded);
		el.addEventListener('timeupdate', onTime);
		el.addEventListener('durationchange', onDurationChange);
		el.addEventListener('ended', onEnded);
		return () => {
			el.removeEventListener('loadedmetadata', onLoaded);
			el.removeEventListener('timeupdate', onTime);
			el.removeEventListener('durationchange', onDurationChange);
			el.removeEventListener('ended', onEnded);
		};
	}, [loaded]);

	function togglePlay() {
		const el = audioRef.current;
		if (!el) return;
		if (playing) { el.pause(); setPlaying(false); }
		else { el.play(); setPlaying(true); }
	}

	function toggleMute() {
		const el = audioRef.current;
		if (!el) return;
		el.muted = !muted;
		setMuted(!muted);
	}

	function cycleSpeed() {
		const el = audioRef.current;
		if (!el) return;
		const next = (speedIdx + 1) % SPEEDS.length;
		el.playbackRate = SPEEDS[next];
		setSpeedIdx(next);
	}

	function handleSeek(e) {
		const el = audioRef.current;
		if (!el || !duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
		const pct = Math.max(0, Math.min(1, x / rect.width));
		el.currentTime = pct * duration;
		setProgress(pct * 100);
	}

	function fmt(s) {
		if (!s || isNaN(s) || s === Infinity) return '—';
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	const trackBg = isMine ? 'rgba(255,255,255,0.2)' : 'var(--bg-hover)';
	const fillColor = isMine ? 'rgba(255,255,255,0.75)' : 'var(--teal-600)';
	const textColor = isMine ? 'text-white/80' : 'text-[var(--text-muted)]';
	const btnColor = isMine
		? 'text-white/90 hover:bg-white/10'
		: 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]';

	const outerClass = compact ? 'flex items-center gap-2 min-w-[120px] max-w-[180px]' : 'flex items-center gap-2.5 min-w-[200px] max-w-[260px]';

	return (
		<div className={outerClass}>
			<audio ref={audioRef} src={src} preload='metadata' />

			<button
				className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full flex items-center justify-center shrink-0 transition-[background] duration-150 ${btnColor}`}
				onClick={togglePlay}
				aria-label={playing ? 'Pause' : 'Play'}
			>
				{playing ? (
					<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
						<rect x='6' y='4' width='4' height='16' rx='1' />
						<rect x='14' y='4' width='4' height='16' rx='1' />
					</svg>
				) : (
					<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
						<polygon points='5,3 19,12 5,21' />
					</svg>
				)}
			</button>

			<div className='flex flex-col gap-1 flex-1 min-w-0'>
				<div
					className='relative h-1.5 rounded-full cursor-pointer'
					style={{ background: trackBg }}
					onClick={handleSeek}
					onTouchStart={handleSeek}
					role='slider'
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.round(progress)}
					aria-label='Seek'
				>
					<div
						className='absolute left-0 top-0 h-full rounded-full transition-[width] duration-75'
						style={{ width: `${progress}%`, background: fillColor }}
					/>
				</div>
				<div className={`flex items-center justify-between text-[10px] font-mono ${textColor}`}>
					<span>{fmt(currentTime)}</span>
					<span>{loaded ? fmt(duration) : '—'}</span>
				</div>
			</div>

			{!compact && (
				<div className='flex flex-col items-center gap-1 shrink-0'>
					<button
						className={`w-6 h-6 rounded flex items-center justify-center transition-[background] duration-150 ${btnColor}`}
						onClick={toggleMute}
						aria-label={muted ? 'Unmute' : 'Mute'}
					>
						{muted ? (
							<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
								<polygon points='11,5 6,9 2,9 2,15 6,15 11,19' />
								<line x1='23' y1='9' x2='17' y2='15' /><line x1='17' y1='9' x2='23' y2='15' />
							</svg>
						) : (
							<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
								<polygon points='11,5 6,9 2,9 2,15 6,15 11,19' />
								<path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
								<path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
							</svg>
						)}
					</button>
					<button
						className={`text-[9px] font-semibold font-mono px-1 py-0.5 rounded transition-[background] duration-150 ${btnColor}`}
						onClick={cycleSpeed}
						aria-label={`Playback speed ${SPEEDS[speedIdx]}x`}
					>
						{SPEEDS[speedIdx]}x
					</button>
				</div>
			)}
		</div>
	);
}