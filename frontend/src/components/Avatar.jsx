import './styles/Avatar.css';

export default function Avatar({ src, username, size = 30, className = '' }) {
	const initial = username?.[0]?.toUpperCase() || '?';

	if (src) {
		return (
			<img
				src={src}
				alt={username || 'avatar'}
				className={`avatar avatar--img ${className}`}
				style={{ width: size, height: size }}
			/>
		);
	}

	return (
		<div
			className={`avatar avatar--initials ${className}`}
			style={{ width: size, height: size, fontSize: size * 0.38 }}
			aria-hidden='true'
		>
			{initial}
		</div>
	);
}