import { useState } from 'react';
import { formatTime, resolveTimestamp } from '../utils/dateFormat';

export default function MessageBubble({ message, isOwn, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete(message.id);
    setConfirming(false);
  }

  function handleMouseLeave() {
    setHovered(false);
    setConfirming(false);
  }

  const timestamp = resolveTimestamp(message);

  return (
    <>
      <style>{`
        @keyframes msg-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className={`flex items-end gap-2 px-5 py-[3px] relative animate-[msg-in_0.2s_ease-out] ${
          isOwn ? 'flex-row-reverse' : ''
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Avatar for other users */}
        {!isOwn && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white/90 shrink-0 mb-0.5"
            style={{
              background:
                'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
            }}
            aria-hidden="true"
          >
            {message.username?.[0]?.toUpperCase()}
          </div>
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
                ? 'bg-teal-700 border border-teal-700 rounded-2xl rounded-br-md'
                : 'bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl rounded-bl-md'
            }`}
          >
            <p
              className={`text-[13.5px] leading-relaxed break-words ${
                isOwn ? 'text-white/95' : 'text-[var(--text-primary)]'
              }`}
            >
              {message.content}
            </p>
            <span
              className={`text-[10px] self-end font-mono ${
                isOwn ? 'text-white/50' : 'text-[var(--text-muted)]'
              }`}
            >
              {formatTime(timestamp)}
            </span>
          </div>
        </div>

        {/* Delete button (own messages only) */}
        {hovered && isOwn && (
          <button
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5 text-red-400 text-[13px] leading-none transition-all duration-150 border ${
              confirming
                ? 'bg-red-400/20 border-red-400/40'
                : 'bg-red-400/8 border-red-400/20 hover:bg-red-400/15 hover:border-red-400/30'
            } focus-visible:outline-2 focus-visible:outline-red-400`}
            onClick={handleDeleteClick}
            title={confirming ? 'Click again to confirm' : 'Delete message'}
            aria-label={confirming ? 'Confirm delete' : 'Delete message'}
          >
            {confirming ? '✓' : '×'}
          </button>
        )}
      </div>
    </>
  );
}