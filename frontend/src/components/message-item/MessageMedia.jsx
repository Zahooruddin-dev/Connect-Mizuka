import { useState } from 'react';
import { DownloadIcon } from './MessageIcons';

export function ImageMessage({ src }) {
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <div
        className='relative overflow-hidden rounded-[inherit] cursor-zoom-in bg-black/10'
        style={{ maxWidth: 280, minWidth: 160 }}
        onClick={() => setLightbox(true)}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setLightbox(true)}
        aria-label='View full image'
      >
        {!loaded && <div className='w-full aspect-[4/3] animate-pulse bg-white/5' />}
        <img
          src={src}
          alt='Shared media content'
          className={`block w-full h-auto transition-opacity duration-300 ease-out-quint ${
            loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
          style={{ maxHeight: 320, objectFit: 'cover' }}
          onLoad={() => setLoaded(true)}
        />
      </div>

      {lightbox && (
        <div
          className='fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-zoom-out transition-all duration-200'
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => e.key === 'Escape' && setLightbox(false)}
          role='dialog'
          aria-modal='true'
          tabIndex={-1}
        >
          <img
            src={src}
            alt='Full screen media'
            className='max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl object-contain'
          />
        </div>
      )}
    </>
  );
}

export function VideoMessage({ src }) {
  return (
    <div className='overflow-hidden rounded-[inherit]' style={{ maxWidth: 300 }}>
      <video src={src} controls className='block w-full' style={{ maxHeight: 280 }} preload='metadata' />
    </div>
  );
}

export function FileMessage({ src, name, isMine }) {
  const filename = name || src?.split('/').pop() || 'File';
  const ext = filename.split('.').pop()?.toUpperCase()?.slice(0, 5) || 'FILE';

  return (
    <a
      href={src}
      target='_blank'
      rel='noopener noreferrer'
      download={filename}
      className={`group flex items-center gap-3 p-1 -m-1 rounded-xl no-underline transition-colors duration-200 ${
        isMine ? 'text-white hover:bg-white/10' : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }`}
      style={{ minWidth: 200, maxWidth: 260 }}
    >
      <div
        className='w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 tracking-wider shadow-sm transition-transform duration-200 group-hover:scale-105'
        style={{ background: isMine ? 'rgba(255,255,255,0.2)' : 'var(--bg-panel)' }}
      >
        {ext}
      </div>
      <div className='flex flex-col overflow-hidden flex-1 min-w-0'>
        <span className='text-sm font-medium truncate leading-tight'>{filename}</span>
        <span className={`text-xs mt-0.5 transition-colors duration-200 ${
          isMine ? 'text-white/60 group-hover:text-white/80' : 'text-[var(--text-ghost)] group-hover:text-[var(--text-muted)]'
        }`}
        >
          Tap to download
        </span>
      </div>
      <span className={`shrink-0 p-2 rounded-full transition-colors duration-200 ${
        isMine ? 'text-white/50 group-hover:text-white group-hover:bg-white/20' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:bg-[var(--border)]'
      }`}>
        <DownloadIcon />
      </span>
    </a>
  );
}

export default null;
