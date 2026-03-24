export default function Avatar({ src, username, size = 30, className = '', onClick, ...props }) {
  const initial = username?.[0]?.toUpperCase() || '?';
  const isInteractive = !!onClick;

  if (src) {
    return (
      <img
        src={src}
        alt={username ? `${username}'s avatar` : 'User avatar'}
        className={`rounded-full shrink-0 object-cover ${isInteractive ? 'cursor-pointer transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]' : ''} ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
        {...(isInteractive ? { tabIndex: 0, role: 'button' } : {})}
        title={username}
      />
    );
  }

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-semibold text-white/90 ${isInteractive ? 'cursor-pointer transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: 'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
      }}
      role={isInteractive ? 'button' : 'img'}
      aria-label={username ? `${username}'s avatar` : 'User avatar'}
      onClick={onClick}
      {...(isInteractive ? { tabIndex: 0 } : {})}
      title={username}
    >
      {initial}
    </div>
  );
}