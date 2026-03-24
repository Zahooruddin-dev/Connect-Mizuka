import { useEffect } from 'react';
import { X, Phone, Video } from 'lucide-react';

const iconBtnCls =
  'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

export default function CallConfirmModal({ callType, targetUsername, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  const isVideo = callType === 'video';
  const Icon = isVideo ? Video : Phone;

  return (
    <>
      <style>{`
        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-pop {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          60% {
            opacity: 1;
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-[2100] flex items-center justify-center p-5 animate-[overlay-fade-in_0.2s_ease-out]"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-confirm-title"
      >
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-[360px] shadow-[0_8px_28px_rgba(0,0,0,0.32)] flex flex-col overflow-hidden animate-[modal-pop_0.2s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 id="call-confirm-title" className="text-sm font-medium text-[var(--text-primary)]">
              Start {isVideo ? 'video' : 'audio'} call
            </h2>
            <button
              className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]`}
              onClick={onCancel}
              aria-label="Close"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="px-5 py-6">
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed text-center">
              Start a {isVideo ? 'video' : 'audio'} call with{' '}
              <span className="font-medium text-[var(--text-primary)]">{targetUsername}</span>?
            </p>
          </div>

          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
            >
              <Icon size={14} strokeWidth={2} />
              Call
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] text-[13px] font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}