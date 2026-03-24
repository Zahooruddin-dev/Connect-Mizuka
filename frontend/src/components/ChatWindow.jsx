import React, { useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useChat } from '../hooks/useChat';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import DateDivider from '../components/DateDivider';
import ChatSkeleton from '../components/ChatSkeleton';
import { formatDate, isSameDay, resolveTimestamp } from '../utils/dateFormat';

export default function ChatWindow({ channelId }) {
  const { user } = useAuth();
  const {
    messages,
    loading,
    typingUser,
    sendMessage,
    handleTyping,
    deleteMsg,
  } = useChat(channelId, user);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  if (!channelId || loading) {
    return <ChatSkeleton isP2P={false} />;
  }

  const sorted = [...messages].sort((a, b) => {
    const ta = resolveTimestamp(a);
    const tb = resolveTimestamp(b);
    if (!ta || !tb) return 0;
    return new Date(ta) - new Date(tb);
  });

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

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-surface)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
          <span className="font-mono text-base text-[var(--text-ghost)]">#</span>
          <span className="text-sm font-medium text-[var(--text-primary)] tracking-[-0.1px] truncate">
            {channelId}
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Live
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto pt-4 pb-2 flex flex-col">
          {sorted.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-[13px]">
              <p>No messages yet. Say hello!</p>
            </div>
          )}

          {sorted.map((msg, idx) => {
            const prev = sorted[idx - 1];
            const msgTs = resolveTimestamp(msg);
            const prevTs = prev ? resolveTimestamp(prev) : null;
            const showDivider = !prev || !isSameDay(prevTs, msgTs);
            const isOwn = msg.sender_id === user?.id || msg.username === user?.username;

            return (
              <React.Fragment key={msg.id || idx}>
                {showDivider && <DateDivider label={formatDate(msgTs)} />}
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  onDelete={deleteMsg}
                />
              </React.Fragment>
            );
          })}

          <TypingIndicator username={typingUser} />
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Input area */}
        <MessageInput
          onSend={sendMessage}
          onTyping={handleTyping}
          channelName={channelId}
        />
      </div>
    </>
  );
}