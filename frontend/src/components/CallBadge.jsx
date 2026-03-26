import { PhoneIcon, VideoCallIcon } from './MessageIcons';
import { formatTime } from '../utils/time';

export const CALL_CONFIG = {
  call_missed: {
    theme: 'text-red-400 bg-red-400/10 border-red-400/20',
    label: 'Missed call',
    crossed: true,
  },
  call_accepted: {
    theme: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    label: 'Call accepted',
    crossed: false,
  },
  call_rejected: {
    theme: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    label: 'Call declined',
    crossed: true,
  },
  call_ended: {
    theme: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    label: 'Call ended',
    crossed: true,
  },
};

export default function CallBadge({ type, content, timestamp }) {
  const cfg = CALL_CONFIG[type] || CALL_CONFIG.call_ended;
  const isVideo = type?.includes('video');
  const Icon = isVideo ? VideoCallIcon : PhoneIcon;

  return (
    <div className='flex flex-col items-center gap-1.5 py-2'>
      <div
        className={`flex items-center gap-2 px-4 py-1.5 border rounded-full text-xs font-medium tracking-wide select-none ${cfg.theme}`}
      >
        <span className='shrink-0 flex items-center justify-center'>
          <Icon crossed={cfg.crossed} />
        </span>
        <span>{cfg.label}</span>
        {content && content !== cfg.label && (
          <span className='opacity-60 font-normal truncate max-w-[120px]'>
            · {content}
          </span>
        )}
      </div>
      <span className='text-[10px] text-[var(--text-ghost)] font-mono select-none'>
        {formatTime(timestamp || Date.now())}
      </span>
    </div>
  );
}
