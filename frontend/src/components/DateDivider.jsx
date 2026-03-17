export default function DateDivider({ label }) {
	return (
		<div className="flex items-center gap-2.5 py-3 px-5">
			<span className="flex-1 h-px bg-[var(--border)]" />
			<span className="text-[11px] font-normal text-[var(--text-ghost)] whitespace-nowrap tracking-[0.2px]">
				{label}
			</span>
			<span className="flex-1 h-px bg-[var(--border)]" />
		</div>
	);
}