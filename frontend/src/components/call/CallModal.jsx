import { useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';

function fmt(s = 0) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function ControlBtn({ onClick, active, danger, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-150 ${
        danger
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : active
            ? 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
            : 'bg-white/10 hover:bg-white/20 text-white'
      }`}
    >
      {children}
    </button>
  );
}

export default function CallModal({
  callState,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && callState?.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState?.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && callState?.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [callState?.remoteStream]);

  if (!callState) return null;

  const {
    phase,
    callType,
    targetUsername,
    remoteUsername,
    isMuted,
    isCameraOff,
    remoteStream,
    duration,
  } = callState;

  const remoteName = remoteUsername ?? targetUsername ?? 'User';
  const displayName = remoteName[0].toUpperCase() + remoteName.slice(1);
  const isActive = phase === 'active';
  const isVideo = callType === 'video';

  return (
    <div className='fixed inset-0 z-[1400] flex items-center justify-center bg-black/70 backdrop-blur-sm'>
      <div
        className='relative w-full max-w-2xl mx-4 bg-[#0d1117] rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] border border-white/[0.06]'
        style={{ minHeight: isVideo ? 420 : 280 }}
      >
        {isVideo && (
          <div className='relative w-full bg-black' style={{ minHeight: 360 }}>
            {isActive && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className='w-full h-full object-cover'
                style={{ minHeight: 360 }}
              />
            ) : (
              <div className='w-full flex flex-col items-center justify-center gap-3 py-16'>
                <div
                  className='w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white'
                  style={{
                    background:
                      'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
                  }}
                >
                  {displayName[0]}
                </div>
                <p className='text-white/60 text-sm'>
                  {isActive ? 'Connecting video…' : `Calling ${displayName}…`}
                </p>
              </div>
            )}

            <div className='absolute bottom-3 right-3 w-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-black aspect-video'>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className='w-full h-full object-cover'
                style={{ transform: 'scaleX(-1)' }}
              />
              {isCameraOff && (
                <div className='absolute inset-0 bg-[#0d1117] flex items-center justify-center'>
                  <VideoOff size={16} className='text-white/40' />
                </div>
              )}
            </div>
          </div>
        )}

        {!isVideo && (
          <div className='flex flex-col items-center gap-4 pt-10 pb-6 px-6'>
            <audio ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
            <div
              className='w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg'
              style={{
                background:
                  'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
              }}
            >
              {displayName[0]}
            </div>
            <div className='text-center'>
              <p className='text-white text-lg font-semibold'>{displayName}</p>
              <p className='text-white/50 text-sm mt-0.5'>
                {isActive ? fmt(duration) : 'Calling…'}
              </p>
            </div>
            {!isActive && (
              <div className='flex gap-1.5 mt-1'>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className='w-1.5 h-1.5 rounded-full bg-[var(--teal-500)] opacity-60'
                    style={{
                      animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className='flex items-center justify-between px-5 py-3 bg-black/40'>
          <div className='min-w-0'>
            <p className='text-white text-sm font-medium truncate'>
              {displayName}
            </p>
            <p className='text-white/40 text-[12px]'>
              {isActive
                ? fmt(duration)
                : isVideo
                  ? 'Video call…'
                  : 'Audio call…'}
            </p>
          </div>

          <div className='flex items-center gap-2 shrink-0'>
            <ControlBtn
              onClick={onToggleMute}
              active={isMuted}
              label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicOff size={18} strokeWidth={2} />
              ) : (
                <Mic size={18} strokeWidth={2} />
              )}
            </ControlBtn>

            {isVideo && (
              <ControlBtn
                onClick={onToggleCamera}
                active={isCameraOff}
                label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isCameraOff ? (
                  <VideoOff size={18} strokeWidth={2} />
                ) : (
                  <Video size={18} strokeWidth={2} />
                )}
              </ControlBtn>
            )}

            <ControlBtn onClick={onEnd} danger label='End call'>
              <PhoneOff size={18} strokeWidth={2} />
            </ControlBtn>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}