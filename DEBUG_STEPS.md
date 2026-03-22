# Debug Steps for Channel Message Issue

## Problem
- Old messages display in channels
- New messages NOT displaying in real-time (but ARE saved to DB)
- P2P messages work fine

## Root Causes Suspected
1. Socket listeners not properly registered
2. Socket message not reaching frontend
3. State not updating properly despite message arrival
4. Cache deduplication accidentally blocking new messages

## Debug Steps

### Step 1: Clean Restart
```bash
# Terminal 1
cd backend  
npm run server
# Should see: [Server] New socket connection: [socket-id]
# When you join a channel: [socket.join] Socket [id] joined channel: [channelId]
```

```bash
# Terminal 2
cd frontend
npm run dev
# Frontend starts on localhost:5173
```

### Step 2: Test Flow in Browser

1. **Open browser DevTools** (F12) → Console tab
2. **Join a channel** in the app
3. **Expected console output** (Frontend):
   ```
   [ChatArea] Setting up socket listeners for Channel: [channelId]
   [ChatArea] Listening on events: receive_message, Display_typing, hide_typing
   [ChatArea] Using cached messages...
   ```

4. **Send a message**
5. **Expected Frontend console output**:
   ```
   [handleSend] Adding temp message: temp-[timestamp] [content]
   [handleSend] Emitting send_message: { channel_id, content, sender_id }
   [handleReceive] Raw socket message: { id, content, sender_id, username, ... }
   [handleReceive] Adding new message to cache: [id] [content]
   ```

6. **Check Backend console** (Terminal 1):
   ```
   [send_message event] Received data: { channel_id, message, sender_id, username, type }
   [handleSendMessage] Received: { channel_id, sender_id, message, type }
   [handleSendMessage] Broadcasting to channel: [channelId]
   Message saved and sent to room: [channelId]
   ```

### Step 3: If Messages Don't Appear

- **Check if backend logs show**: "[handleSendMessage] Broadcasting to channel..."
  - If NO: Message isn't being sent by client
  - If YES: Message is sent but frontend not receiving

- **Check if frontend logs show**: "[handleReceive] Raw socket message:"
  - If NO: Socket emit isn't reaching frontend
  - If YES: Frontend received but state not updating

- **Check browser Network tab**:
  - Look for WebSocket connection
  - Verify it says "Connected" (should be green)

## Quick Checklist

- [ ] Backend running and showing connection logs
- [ ] Frontend joined channel (check console for "socket listeners...")
- [ ] Sent test message as temp message logged 
- [ ] Backend shows "[send_message event]" log
- [ ] Backend shows "[handleSendMessage] Broadcasting..."
- [ ] Frontend shows "[handleReceive] Raw socket message..."
- [ ] Message appears in UI

If any step shows NO, that's where the issue is.
