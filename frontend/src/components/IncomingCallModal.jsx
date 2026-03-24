import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';

export default function IncomingCallModal({
	callerUsername,
	callType,
	onAccept,
	onReject,
}) {
	const initial = callerUsername?.[0]?.toUpperCase() || '?';
	const [remaining, setRemaining] = useState(15);
	const intervalRef = useRef(null);

	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current);
					onReject();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(intervalRef.current);
	}, [onReject]);

	return (
		<div className='fixed bottom-6 right-6 z-[1500] w-72 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-4 flex flex-col gap-4 animate-in'>
			<style>{`
				@keyframes incoming-slide {
					from { opacity: 0; transform: translateY(12px) scale(0.97); }
					to   { opacity: 1; transform: translateY(0)   scale(1); }
				}
				.animate-in { animation: incoming-slide 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }
				@keyframes ring-pulse {
					0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.35); }
					50%       { box-shadow: 0 0 0 10px rgba(20,184,166,0); }
				}
				.ring-pulse { animation: ring-pulse 1.2s ease-in-out infinite; }
			`}</style>

			<div className='flex items-center gap-3'>
				<div
					className='w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-semibold text-white shrink-0 ring-pulse'
					style={{
						background:
							'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
					}}
				>
					{initial}
				</div>
				<div className='min-w-0'>
					<div className='text-sm font-semibold text-[var(--text-primary)] truncate'>
						{callerUsername
							? callerUsername[0].toUpperCase() + callerUsername.slice(1)
							: 'Someone'}
					</div>
					<div className='flex items-center gap-1.5 text-[12px] text-[var(--text-ghost)]'>
						{callType === 'video' ? (
							<>
								<Video size={11} strokeWidth={2} /> Incoming video call
							</>
						) : (
							<>
								<Phone size={11} strokeWidth={2} /> Incoming audio call
							</>
						)}
					</div>
				</div>
				<div className='ml-auto shrink-0 text-[12px] font-medium text-[var(--text-ghost)]'>
					{remaining}s
				</div>
			</div>

			<div className='flex gap-2'>
				<button
					onClick={onReject}
					className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-medium transition-colors duration-150'
					aria-label='Decline call'
				>
					<PhoneOff size={14} strokeWidth={2} />
					Decline
				</button>
				<button
					onClick={onAccept}
					className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--teal-700)] hover:bg-[var(--teal-600)] text-white text-[13px] font-medium transition-colors duration-150'
					aria-label='Accept call'
				>
					<Phone size={14} strokeWidth={2} />
					Accept
				</button>
			</div>
		</div>
	);
}
