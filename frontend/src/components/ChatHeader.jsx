import { useState, useRef, useEffect, useCallback } from 'react';
import { deleteChannel, updateChannel, getUserProfile } from '../services/api';
import UserProfilePopover from './Userprofilepopover';
import socket from '../services/socket';
import ChatHeaderContent from './ChatHeaderContent';
import CallConfirmModal from './CallConfirmModal';

function ChatHeader({
  channelId,
  channelLabel,
  instituteId,
  onChannelDeleted,
  onChannelRenamed,
  isAdmin,
  isP2P,
  otherUsername,
  otherUserId,
  onCloseP2P,
  onStartCall,
  onOpenSidebar,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(channelLabel || '');
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(channelLabel || '');
  const [otherPicture, setOtherPicture] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [callData, setCallData] = useState(null); // { targetUserId, targetUsername, callType }

  const inputRef = useRef(null);
  const channelIdRef = useRef(channelId);

  useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);

  useEffect(() => {
    setNameInput(channelLabel || '');
    setDisplayName(channelLabel || '');
  }, [channelLabel]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!isP2P || !otherUserId) return;
    setOtherPicture(null);
    getUserProfile(otherUserId)
      .then((data) => {
        if (data?.user?.profile_picture)
          setOtherPicture(data.user.profile_picture);
      })
      .catch(() => {});
  }, [isP2P, otherUserId]);

  useEffect(() => {
    if (isP2P) return;
    const handleSocketRenamed = ({ channel }) => {
      if (channel.id === channelIdRef.current) {
        setDisplayName(channel.name);
        setNameInput(channel.name);
      }
    };
    const handleSocketDeleted = ({ channelId: deletedId }) => {
      if (deletedId === channelIdRef.current) onChannelDeleted?.(deletedId);
    };
    socket.on('channel_renamed', handleSocketRenamed);
    socket.on('channel_deleted', handleSocketDeleted);
    return () => {
      socket.off('channel_renamed', handleSocketRenamed);
      socket.off('channel_deleted', handleSocketDeleted);
    };
  }, [isP2P, onChannelDeleted]);

  const handleEditStart = useCallback(() => {
    setNameInput(channelLabel || '');
    setError('');
    setEditing(true);
  }, [channelLabel]);

  const handleEditCancel = useCallback(() => {
    setEditing(false);
    setNameInput(channelLabel || '');
    setError('');
  }, [channelLabel]);

  const handleEditSave = useCallback(async () => {
    const trimmed = nameInput
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
    if (!trimmed) {
      setError('Channel name cannot be empty');
      return;
    }
    if (trimmed === channelLabel) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError('');
    const res = await updateChannel(channelId, { name: trimmed });
    setSaving(false);
    if (res?.channel) {
      setDisplayName(res.channel.name);
      socket.emit('channel_renamed', { channel: res.channel, instituteId });
      setEditing(false);
      onChannelRenamed?.(res.channel);
    } else {
      setError(res?.message || 'Failed to rename channel');
    }
  }, [nameInput, channelLabel, channelId, instituteId, onChannelRenamed]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleEditSave();
      if (e.key === 'Escape') handleEditCancel();
    },
    [handleEditSave, handleEditCancel],
  );

  const handleDeleteChannel = useCallback(async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await deleteChannel(channelId);
      if (res?.error) {
        setError(res.error);
        setDeleting(false);
        setShowConfirm(false);
        return;
      }
      socket.emit('channel_deleted', { channelId, instituteId });
      onChannelDeleted?.(channelId);
    } catch {
      setError('Failed to delete channel');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [channelId, instituteId, onChannelDeleted]);

  const handleCallClick = useCallback((data) => {
    setCallData(data);
  }, []);

  const handleConfirmCall = useCallback(() => {
    if (!callData) return;
    onStartCall(callData);
    setCallData(null);
  }, [callData, onStartCall]);

  const handleCancelCall = useCallback(() => {
    setCallData(null);
  }, []);

  return (
    <>
      <ChatHeaderContent
        isP2P={isP2P}
        onCloseP2P={onCloseP2P}
        otherUsername={otherUsername}
        otherPicture={otherPicture}
        onShowPopover={() => setShowPopover(true)}
        onStartCall={handleCallClick}
        otherUserId={otherUserId}
        onOpenSidebar={onOpenSidebar}
        editing={editing}
        nameInput={nameInput}
        onNameInputChange={setNameInput}
        onKeyDown={handleKeyDown}
        saving={saving}
        onEditSave={handleEditSave}
        onEditCancel={handleEditCancel}
        displayName={displayName}
        channelId={channelId}
        isAdmin={isAdmin}
        onEditStart={handleEditStart}
        error={error}
        showConfirm={showConfirm}
        onConfirmDelete={handleDeleteChannel}
        deleting={deleting}
        onToggleConfirm={() => setShowConfirm((v) => !v)}
      />
      {showPopover && otherUserId && (
        <UserProfilePopover
          userId={otherUserId}
          onClose={() => setShowPopover(false)}
          onStartP2P={null}
        />
      )}
      {callData && (
        <CallConfirmModal
          callType={callData.callType}
          targetUsername={callData.targetUsername}
          onConfirm={handleConfirmCall}
          onCancel={handleCancelCall}
        />
      )}
    </>
  );
}

export default ChatHeader;