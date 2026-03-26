import { Check, X, AlertCircle, Info } from 'lucide-react';

const ICONS = {
  success: <Check size={14} strokeWidth={2.5} aria-hidden="true" />,
  error: <X size={14} strokeWidth={2.5} aria-hidden="true" />,
  info: <Info size={14} strokeWidth={2} aria-hidden="true" />,
  warning: <AlertCircle size={14} strokeWidth={2} aria-hidden="true" />,
};

const STYLES = {
  success: 'bg-teal-600/90 border-teal-500 text-teal-100 icon:text-teal-200',
  error: 'bg-red-600/90 border-red-500 text-red-100 icon:text-red-200',
  info: 'bg-blue-600/90 border-blue-500 text-blue-100 icon:text-blue-200',
  warning: 'bg-amber-600/90 border-amber-500 text-amber-100 icon:text-amber-200',
};

export default function Toast({ message, visible, type = 'success' }) {
  const styleClass = STYLES[type] || STYLES.success;

  return (
    <>
      <style>{`
        @keyframes toast-in {
          0% {
            opacity: 0;
            transform: translate(-50%, 12px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        @keyframes toast-out {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 8px) scale(0.96);
          }
        }
      `}</style>

      <div
        className={`fixed bottom-6 left-1/2 z-[1600] flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium whitespace-nowrap pointer-events-none border shadow-lg backdrop-blur-sm transition-all duration-200 ${
          visible
            ? 'animate-[toast-in_0.2s_cubic-bezier(0.16,1,0.3,1)_forwards]'
            : 'animate-[toast-out_0.15s_ease-out_forwards]'
        } ${styleClass}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={`flex items-center shrink-0 ${styleClass.split(' ').find(c => c.startsWith('icon:'))?.replace('icon:', '') || ''}`}>
          {ICONS[type]}
        </span>
        <span>{message}</span>
      </div>
    </>
  );
}