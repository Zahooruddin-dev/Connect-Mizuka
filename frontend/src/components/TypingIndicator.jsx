export default function TypingIndicator({ username }) {
  if (!username) return null;

  return (
    <>
      <style>{`
        @keyframes typing-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }
          40% {
            transform: translateY(-4px);
            opacity: 0.8;
          }
        }
      `}</style>
      <div className="flex items-end gap-2 px-5 pt-1 pb-2 animate-[typing-fade-in_0.2s_ease-out]">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--teal-800), var(--teal-600))' }}
          aria-hidden="true"
        >
          {username[0].toUpperCase()}
        </span>
        <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl rounded-bl-md px-3.5 py-2 flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">{username}</span>
          <div className="flex items-center gap-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-[bounce-dot_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}