import { useState, useRef, useEffect, useCallback } from 'react';
import MessageItem from './MessageItem';

const ChatContainer = ({
  messages,
  currentUserId,
  currentUserPicture,
  onMessageDeleted,
  onMessageEdited,
  onUserClick,
}) => {
  const containerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);

  // Check if the scroll position is near the bottom (within 100px)
  const checkIfNearBottom = useCallback(() => {
    if (!containerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Scroll to the bottom smoothly
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Handle scroll events to toggle button and track near-bottom status
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom);
  }, [checkIfNearBottom]);

  // Auto‑scroll when new messages arrive if the user was already near the bottom
  useEffect(() => {
    const newMessageCount = messages.length;
    const isNewMessage = newMessageCount > prevMessageCount;
    if (isNewMessage && isNearBottom) {
      scrollToBottom();
    }
    setPrevMessageCount(newMessageCount);
  }, [messages, isNearBottom, scrollToBottom, prevMessageCount]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // If messages change and we are not auto‑scrolling, we might still want to update
  // the button state (e.g., if the container height changes)
  useEffect(() => {
    handleScroll();
  }, [messages, handleScroll]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 pb-4 scroll-smooth"
      style={{ height: '100%' }} // adjust as needed
    >
      {messages.map((message) => (
        <MessageItem
          key={message.id || message._id}
          message={message}
          currentUserId={currentUserId}
          currentUserPicture={currentUserPicture}
          onDeleted={onMessageDeleted}
          onEdit={onMessageEdited}
          onUserClick={onUserClick}
        />
      ))}

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed left-6 bottom-6 z-50 bg-[var(--bg-panel)] border border-[var(--border)] rounded-full p-3 shadow-lg hover:bg-[var(--bg-hover)] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Scroll to latest message"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-primary)] group-hover:scale-110 transition-transform"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatContainer;