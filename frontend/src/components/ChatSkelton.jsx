const ROWS = [
	{ mine: false, bubbleW: '52%', hasUsername: true, twoLines: false },
	{ mine: false, bubbleW: '38%', hasUsername: false, twoLines: true },
	{ mine: true, bubbleW: '44%', hasUsername: false, twoLines: false },
	{ mine: true, bubbleW: '28%', hasUsername: false, twoLines: false },
	{ mine: false, bubbleW: '60%', hasUsername: true, twoLines: true },
	{ mine: false, bubbleW: '35%', hasUsername: false, twoLines: false },
	{ mine: true, bubbleW: '48%', hasUsername: false, twoLines: true },
	{ mine: false, bubbleW: '55%', hasUsername: true, twoLines: false },
	{ mine: true, bubbleW: '32%', hasUsername: false, twoLines: false },
	{ mine: true, bubbleW: '50%', hasUsername: false, twoLines: true },
];

function SkelBlock({ width, height = 12, radius = 6, style = {} }) {
	return (
		<div
			className='shimmer'
			style={{ width, height, borderRadius: radius, ...style }}
		/>
	);
}

function SkelRow({ mine, bubbleW, hasUsername, twoLines }) {
	return (
		<div
			className={`flex items-end gap-2.5 py-[3px] ${mine ? 'flex-row-reverse' : ''}`}
		>
			<div className='shimmer w-7 h-7 min-w-[28px] rounded-full mb-[18px] shrink-0' />

			<div className={`flex flex-col max-w-[65%] ${mine ? 'items-end' : ''}`}>
				{hasUsername && !mine && (
					<SkelBlock
						width={64}
						height={10}
						style={{ marginBottom: 4, marginLeft: 4 }}
					/>
				)}

				<div
					className={`shimmer px-3.5 py-2.5 min-h-[38px] flex flex-col justify-center gap-1.5 rounded-[var(--radius-lg)] ${
						mine ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'
					}`}
					style={{ width: bubbleW }}
				>
					<SkelBlock width='90%' height={12} />
					{twoLines && <SkelBlock width='65%' height={12} />}
				</div>

				<SkelBlock
					width={36}
					height={9}
					style={{
						marginTop: 4,
						marginLeft: mine ? 'auto' : 4,
						marginRight: mine ? 4 : 'auto',
					}}
				/>
			</div>
		</div>
	);
}

export default function ChatSkeleton({ isP2P }) {
	return (
		<div className='flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]'>
			<div className='h-14 px-5 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0'>
				<div className='flex items-center gap-2.5'>
					{isP2P ? (
						<>
							<div className='shimmer w-8 h-8 min-w-[32px] rounded-full shrink-0' />
							<div className='flex flex-col gap-1'>
								<SkelBlock width={96} height={13} />
								<SkelBlock width={72} height={10} />
							</div>
						</>
					) : (
						<>
							<SkelBlock width={18} height={18} radius={4} />
							<SkelBlock width={110} height={14} style={{ marginLeft: 8 }} />
						</>
					)}
				</div>
			</div>

			<div className='flex-1 overflow-hidden py-4'>
				<div className='flex flex-col gap-0.5 px-5 min-h-full justify-end'>
					{ROWS.map((row, i) => (
						<SkelRow key={i} {...row} />
					))}
				</div>
			</div>

			<div className='px-5 pt-3 pb-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-1.5 shrink-0'>
				<div className='flex items-center gap-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-[var(--radius-lg)] py-3 pl-4 pr-2'>
					<SkelBlock width='88%' height={14} />
					<div className='shimmer w-[34px] h-[34px] min-w-[34px] rounded-[var(--radius-md)] shrink-0' />
				</div>
				<SkelBlock width={180} height={9} style={{ marginLeft: 4 }} />
			</div>
		</div>
	);
}
