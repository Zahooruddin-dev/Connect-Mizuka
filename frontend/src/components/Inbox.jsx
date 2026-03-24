import { useState, useCallback, useRef, useEffect } from 'react';
import { searchInstituteMembers, searchAllP2PChats } from '../services/api';
import { getOrCreateP2PRoom, markRoomAsRead } from '../services/p2p-api';
import socket from '../services/socket';
import InboxContent from './InboxContent';

function Inbox({
  activeInstitute,
  currentUser,
  onStartP2P,
  onlineUsers = new Set(),
  activeP2P,
  onUnreadUpdate,
  onJumpToP2PMessage,
  recentChats,
  setRecentChats,
  roomUnread,
  setRoomUnread,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(null);
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearchTerm, setMsgSearchTerm] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState([]);
  const [msgSearchLoading, setMsgSearchLoading] = useState(false);

  const debounceTimer = useRef(null);
  const msgDebounceTimer = useRef(null);
  const msgSearchInputRef = useRef(null);

  const recentChatsRef = useRef(recentChats);
  useEffect(() => {
    recentChatsRef.current = recentChats;
  }, [recentChats]);

  useEffect(() => {
    if (msgSearchOpen) msgSearchInputRef.current?.focus();
  }, [msgSearchOpen]);

  useEffect(() => {
    if (!activeP2P?.roomId || !currentUser?.id) return;
    markRoomAsRead(activeP2P.roomId).then(() => {
      onUnreadUpdate?.();
    });
    setRoomUnread((prev) => {
      const next = { ...prev };
      delete next[activeP2P.roomId];
      return next;
    });
  }, [activeP2P?.roomId, currentUser?.id, onUnreadUpdate, setRoomUnread]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      clearTimeout(msgDebounceTimer.current);
    };
  }, []);

  const handleSearch = useCallback(
    (val) => {
      setSearchTerm(val);
      clearTimeout(debounceTimer.current);
      if (val.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const users = await searchInstituteMembers(
            activeInstitute.id,
            val,
            currentUser.id,
          );
          setResults(users || []);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [activeInstitute.id, currentUser.id],
  );

  const handleStartChat = useCallback(
    async (user) => {
      if (startingChat === user.id) return;
      setStartingChat(user.id);
      try {
        const res = await getOrCreateP2PRoom(user.id);
        if (res.error || !res.chatroom) return;
        socket.emit('join_p2p', res.chatroom.id);
        const entry = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile_picture: user.profile_picture || null,
          roomId: res.chatroom.id,
          lastChat: new Date().toISOString(),
        };
        setRecentChats((prev) => {
          const idx = prev.findIndex((c) => c.roomId === entry.roomId);
          const next =
            idx !== -1
              ? prev.map((c, i) => (i === idx ? { ...c, ...entry } : c))
              : [entry, ...prev].slice(0, 20);
          localStorage.setItem('mizuka_recent_p2p_chats', JSON.stringify(next));
          return next;
        });
        onStartP2P?.({
          roomId: res.chatroom.id,
          otherUserId: user.id,
          otherUsername: user.username,
        });
        setSearchTerm('');
        setResults([]);
      } catch {
      } finally {
        setStartingChat(null);
      }
    },
    [onStartP2P, startingChat, setRecentChats],
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
  }, []);

  const handleMsgSearchInput = useCallback((val) => {
    setMsgSearchTerm(val);
    clearTimeout(msgDebounceTimer.current);

    if (!val.trim() || val.length < 2) {
      setMsgSearchResults([]);
      return;
    }

    setMsgSearchLoading(true);
    msgDebounceTimer.current = setTimeout(async () => {
      const chats = recentChatsRef.current;
      if (!chats.length) {
        setMsgSearchLoading(false);
        return;
      }

      try {
        const raw = await searchAllP2PChats(
          chats.map((c) => c.roomId),
          val,
        );
        const results = raw.map((msg) => {
          const chat = chats.find((c) => c.roomId === msg.room_id);
          return {
            ...msg,
            roomId: msg.room_id,
            otherUserId: chat?.id,
            otherUsername: chat?.username,
          };
        });
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMsgSearchResults(results);
      } catch {
        setMsgSearchResults([]);
      } finally {
        setMsgSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleMsgResultClick = useCallback(
    (result) => {
      onJumpToP2PMessage?.(
        result.roomId,
        result.id,
        result.otherUserId,
        result.otherUsername,
      );
      setMsgSearchOpen(false);
      setMsgSearchTerm('');
      setMsgSearchResults([]);
    },
    [onJumpToP2PMessage],
  );

  const handleCloseMsgSearch = useCallback(() => {
    setMsgSearchOpen(false);
    setMsgSearchTerm('');
    setMsgSearchResults([]);
  }, []);

  return (
    <InboxContent
      activeInstitute={activeInstitute}
      currentUser={currentUser}
      onStartP2P={onStartP2P}
      onlineUsers={onlineUsers}
      activeP2P={activeP2P}
      onUnreadUpdate={onUnreadUpdate}
      onJumpToP2PMessage={onJumpToP2PMessage}
      recentChats={recentChats}
      setRecentChats={setRecentChats}
      roomUnread={roomUnread}
      setRoomUnread={setRoomUnread}
      searchTerm={searchTerm}
      results={results}
      loading={loading}
      startingChat={startingChat}
      msgSearchOpen={msgSearchOpen}
      msgSearchTerm={msgSearchTerm}
      msgSearchResults={msgSearchResults}
      msgSearchLoading={msgSearchLoading}
      onSearchChange={handleSearch}
      onClearSearch={handleClearSearch}
      onStartChat={handleStartChat}
      onToggleMsgSearch={() => setMsgSearchOpen((v) => !v)}
      onMsgSearchChange={handleMsgSearchInput}
      onClearMsgSearch={handleCloseMsgSearch}
      onMsgResultClick={handleMsgResultClick}
      msgSearchInputRef={msgSearchInputRef}
    />
  );
}

export default Inbox;