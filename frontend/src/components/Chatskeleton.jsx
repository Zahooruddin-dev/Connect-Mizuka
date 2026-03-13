import './styles/ChatSkeleton.css';

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

function SkeletonBlock({ width, height = 12, radius = 6, style = {} }) {
	return (
		<div
			className='skel-block'
			style={{ width, height, borderRadius: radius, ...style }}
		/>
	);
}

function SkeletonMessageRow({ mine, bubbleW, hasUsername, twoLines }) {
	return (
		<div className={`skel-row ${mine ? 'skel-row--mine' : 'skel-row--theirs'}`}>
			<div className='skel-avatar' />

			<div className='skel-content'>
				{hasUsername && !mine && (
					<SkeletonBlock
						width={64}
						height={10}
						style={{ marginBottom: 4, marginLeft: 4 }}
					/>
				)}

				<div
					className={`skel-bubble ${mine ? 'skel-bubble--mine' : 'skel-bubble--theirs'}`}
					style={{ width: bubbleW }}
				>
					<SkeletonBlock width='90%' height={12} />
					{twoLines && (
						<SkeletonBlock width='65%' height={12} style={{ marginTop: 6 }} />
					)}
				</div>

				<SkeletonBlock
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
		<div className='skel-wrap'>
			<div className='skel-header'>
				<div className='skel-header-left'>
					{isP2P ? (
						<>
							<div className='skel-avatar skel-avatar--header' />
							<div className='skel-header-info'>
								<SkeletonBlock width={96} height={13} />
								<SkeletonBlock
									width={72}
									height={10}
									style={{ marginTop: 4 }}
								/>
							</div>
						</>
					) : (
						<>
							<SkeletonBlock width={18} height={18} radius={4} />
							<SkeletonBlock
								width={110}
								height={14}
								style={{ marginLeft: 8 }}
							/>
						</>
					)}
				</div>
			</div>

			<div className='skel-messages'>
				<div className='skel-messages-inner'>
					{ROWS.map((row, i) => (
						<SkeletonMessageRow key={i} {...row} />
					))}
				</div>
			</div>

			<div className='skel-input-bar'>
				<div className='skel-input-wrap'>
					<SkeletonBlock width='88%' height={14} />
					<div className='skel-send-btn' />
				</div>
				<SkeletonBlock width={180} height={9} style={{ marginLeft: 4 }} />
			</div>
		</div>
	);
}
