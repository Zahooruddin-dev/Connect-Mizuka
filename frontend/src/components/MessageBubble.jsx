import { useState } from 'react';
import { formatTime, resolveTimestamp } from '../utils/dateFormat';

export default function MessageBubble({ message, isOwn, onDelete }) {
	const [hovered, setHovered] = useState(false);
	const [confirming, setConfirming] = useState(false);

	function handleDeleteClick() {
		if (!confirming) { setConfirming(true); return; }
		onDelete(message.id);
		setConfirming(false);
	}

	function handleMouseLeave() {
		setHovered(false);
		setConfirming(false);
	}

	const timestamp = resolveTimestamp(message);

	return (
		<div
			className={`flex items-end gap-2 px-5 py-[3px] relative ${isOwn ? 'flex-row-reverse' : ''}`}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={handleMouseLeave}
		>
			{!isOwn && (
				<span
					className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white/85 shrink-0 mb-0.5"
					style={{ background: 'linear-gradient(135deg, var(--teal-800), var(--teal-600))' }}
					aria-hidden="true"
				>
					{message.username?.[0]?.toUpperCase()}
				</span>
			)}

			<div className={`flex flex-col gap-0.5 max-w-[68%] ${isOwn ? 'items-end' : ''}`}>
				{!isOwn && (
					<span className="text-[11px] font-medium text-[var(--text-muted)] pl-1">
						{message.username}
					</span>
				)}
				<div
					className={`px-3.5 py-2.5 flex flex-col gap-1 ${
						isOwn
							? 'bg-[var(--teal-700)] border border-[var(--teal-700)] rounded-[var(--radius-lg)] rounded-br-[var(--radius-sm)]'
							: 'bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] rounded-bl-[var(--radius-sm)]'
					}`}
				>
					<p className={`text-[13.5px] leading-[1.5] break-words ${isOwn ? 'text-white/[0.92]' : 'text-[var(--text-primary)]'}`}>
						{message.content}
					</p>
					<span className={`text-[10px] self-end font-mono ${isOwn ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>
						{formatTime(timestamp)}
					</span>
				</div>
			</div>

			{hovered && isOwn && (
				<button
					className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mb-0.5 text-red-400 text-[13px] leading-none transition-[background,border-color] duration-150 border ${
						confirming
							? 'bg-red-400/20 border-red-400/35'
							: 'bg-red-400/[0.08] border-red-400/15 hover:bg-red-400/15'
					}`}
					onClick={handleDeleteClick}
					title={confirming ? 'Click again to confirm' : 'Delete message'}
					aria-label={confirming ? 'Confirm delete' : 'Delete message'}
				>
					{confirming ? '✓' : '×'}
				</button>
			)}
		</div>
	);
}