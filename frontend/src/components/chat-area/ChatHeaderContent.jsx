import {
  Pencil,
  Check,
  X,
  Trash2,
  Hash,
  ArrowLeft,
  Phone,
  Video,
  Menu,
} from 'lucide-react';

const iconBtnCls =
  'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]';

export default function ChatHeaderContent({
  isP2P,
  otherUsername,
  otherPicture,
  onShowPopover,
  onStartCall,
  otherUserId,
  onOpenSidebar,
  editing,
  nameInput,
  onNameInputChange,
  onKeyDown,
  saving,
  onEditSave,
  onEditCancel,
  displayName,
  channelId,
  isAdmin,
  onEditStart,
  error,
  showConfirm,
  onConfirmDelete,
  deleting,
  onToggleConfirm,
}) {
if (isP2P) {
  return (
    <>
      <header className="flex items-center gap-2 px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
        {onOpenSidebar && (
          <button
            className={`${iconBtnCls} md:hidden text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]`}
            onClick={onOpenSidebar}
            aria-label="Open navigation"
            aria-haspopup="dialog"
          >
            <Menu size={17} strokeWidth={2} />
          </button>
        )}

        <button
          className="flex items-center gap-3 flex-1 min-w-0 rounded-md px-1 py-1 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
          onClick={onShowPopover}
          title={`View ${otherUsername}'s profile`}
        >
          {otherPicture ? (
            <img
              src={otherPicture}
              alt={otherUsername}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[var(--border)]"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-white/90 shrink-0 ring-1 ring-[var(--border)]"
              style={{
                background:
                  'linear-gradient(135deg, var(--teal-800), var(--teal-600))',
              }}
            >
              {otherUsername?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 text-left">
            <div className="text-sm font-medium text-[var(--text-primary)] truncate leading-tight">
              {otherUsername
                ? otherUsername[0].toUpperCase() + otherUsername.slice(1)
                : 'Chat'}
            </div>
            <div className="text-[11px] text-[var(--text-ghost)]">
              Direct Message
            </div>
          </div>
        </button>

        {onStartCall && otherUserId && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--teal-500)]`}
              onClick={() =>
                onStartCall({
                  targetUserId: otherUserId,
                  targetUsername: otherUsername,
                  callType: 'audio',
                })
              }
              aria-label="Audio call"
              title="Audio call"
            >
              <Phone size={16} strokeWidth={2} />
            </button>
            <button
              className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--teal-500)]`}
              onClick={() =>
                onStartCall({
                  targetUserId: otherUserId,
                  targetUsername: otherUsername,
                  callType: 'video',
                })
              }
              aria-label="Video call"
              title="Video call"
            >
              <Video size={16} strokeWidth={2} />
            </button>
          </div>
        )}
      </header>
    </>
  );
}

  return (
    <header className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
      {onOpenSidebar && (
        <button
          className={`${iconBtnCls} md:hidden text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)]`}
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          aria-haspopup="dialog"
        >
          <Menu size={17} strokeWidth={2} />
        </button>
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Hash size={15} strokeWidth={2} className="text-[var(--text-ghost)] shrink-0" />
            <input
              className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--teal-600)] rounded-md px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--teal-500)]/30 focus:border-[var(--teal-500)] transition-all duration-150 font-[inherit] disabled:opacity-50"
              value={nameInput}
              onChange={(e) => onNameInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={64}
              disabled={saving}
              aria-label="Channel name"
              spellCheck={false}
            />
            <button
              className={`${iconBtnCls} text-[var(--teal-600)] hover:bg-teal-500/10 disabled:opacity-40`}
              onClick={onEditSave}
              disabled={saving}
              aria-label="Save"
            >
              <Check size={14} strokeWidth={2.5} />
            </button>
            <button
              className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-red-400 disabled:opacity-40`}
              onClick={onEditCancel}
              disabled={saving}
              aria-label="Cancel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group flex-1 min-w-0">
            <Hash size={15} strokeWidth={2} className="text-[var(--text-ghost)] shrink-0" />
            <span className="text-sm font-medium text-[var(--text-primary)] tracking-[-0.1px] truncate">
              {displayName || channelId}
            </span>
            {isAdmin && (
              <button
                className={`${iconBtnCls} text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all duration-150`}
                onClick={onEditStart}
                aria-label="Rename"
              >
                <Pencil size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {error && (
          <span className="hidden sm:inline text-[12px] text-red-400">{error}</span>
        )}
        {isAdmin && !editing && (
          showConfirm ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[12px] text-[var(--text-muted)]">
                Delete channel?
              </span>
              <button
                className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-[12px] font-medium hover:bg-red-500/20 transition-colors duration-150 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-red-400"
                onClick={onConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes'}
              </button>
              <button
                className="px-2.5 py-1 rounded-md bg-[var(--bg-hover)] text-[var(--text-muted)] text-[12px] font-medium hover:bg-[var(--border)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
                onClick={onToggleConfirm}
              >
                No
              </button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-[var(--text-ghost)] hover:text-red-400 hover:bg-red-400/5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]"
              onClick={onToggleConfirm}
              title="Delete channel"
            >
              <Trash2 size={13} strokeWidth={2} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}