export default function TypingIndicator({ username }) {
	if (!username) return null;
	return (
		<div className="flex items-end gap-2 px-5 pt-1 pb-2 animate-[typing-fade-in_0.2s_ease]">
			<span
				className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white/85 shrink-0"
				style={{ background: 'linear-gradient(135deg, var(--teal-800), var(--teal-600))' }}
				aria-hidden="true"
			>
				{username[0].toUpperCase()}
			</span>
			<div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] rounded-bl-[var(--radius-sm)] px-3.5 py-2 flex items-center gap-2">
				<span className="text-[11px] text-[var(--text-muted)]">{username}</span>
				<div className="flex items-center gap-[3px]">
					{[0, 150, 300].map((delay) => (
						<span
							key={delay}
							className="w-1 h-1 rounded-full bg-[var(--teal-800)] animate-[bounce-dot_1.2s_ease-in-out_infinite]"
							style={{ animationDelay: `${delay}ms` }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}