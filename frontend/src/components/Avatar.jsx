export default function Avatar({ src, username, size = 30, className = '' }) {
	const initial = username?.[0]?.toUpperCase() || '?';

	const base = 'rounded-full shrink-0 flex items-center justify-content font-semibold text-white/90';

	if (src) {
		return (
			<img
				src={src}
				alt={username ? `${username}'s avatar` : 'User avatar'}
				className={`${base} object-cover ${className}`}
				style={{ width: size, height: size }}
			/>
		);
	}

	return (
		<div
			className={`${base} ${className}`}
			style={{
				width: size,
				height: size,
				fontSize: size * 0.38,
				background: 'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
			}}
			role="img"
			aria-label={username ? `${username}'s avatar` : 'User avatar'}
		>
			{initial}
		</div>
	);
}