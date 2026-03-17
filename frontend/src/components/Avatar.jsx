export default function Avatar({ src, username, size = 30, className = '' }) {
	const initial = username?.[0]?.toUpperCase() || '?';

	if (src) {
		return (
			<img
				src={src}
				alt={username ? `${username}'s avatar` : 'User avatar'}
				className={`rounded-full shrink-0 object-cover ${className}`}
				style={{ width: size, height: size }}
			/>
		);
	}

	return (
		<div
			className={`rounded-full shrink-0 flex items-center justify-center font-semibold text-white/90 ${className}`}
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
