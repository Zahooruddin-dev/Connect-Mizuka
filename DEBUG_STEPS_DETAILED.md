# Channel Message Debug Checklist

## Step 1: Clean Restart

**Kill all running processes** - Press Ctrl+C in all terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm run server
```

**Expected output:**
```
Mizuka Engine Live on Port 3000
[Server] New socket connection: [socket-id]
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```

**Expected output:**
```
  VITE v... ▶ http://localhost:5173/
```

**Terminal 3 - Watch Browser Console:**
- Open DevTools (F12) → Console tab
- Keep it open while testing

---

## Step 2: Check Socket Connection

1. Go to http://localhost:5173 in browser
2. **Look for in browser console:**
   ```
   ✅ Socket connected: [socket-id]
   ```
   - If you see this: Socket connection OK ✓
   - If NOT: Connection problem (check backend logs for errors)

---

## Step 3: Join a Channel & Send Message

1. **Join any channel in the app**
2. **Browser console should show:**
   ```
   [ChatArea] Setting up socket listeners for Channel: [channelId]
   [ChatArea] Listening on events: receive_message, Display_typing, hide_typing
   [ChatArea] Using cached messages...
   ```
   - If you see these: Listeners registered ✓
   - If NOT: The effect hook isn't running properly

3. **Send a test message** (e.g., "TEST123")
4. **Immediately watch console** - you should see in order:

   **Frontend Console:**
   ```
   [handleSend] Adding temp message: temp-[timestamp] TEST123
   [handleSend] Emitting send_message: { channel_id, content: "TEST123", sender_id }
   ```

   **Backend Console:**
   ```
   [send_message event] Received data: { channel_id, message: "TEST123", sender_id, username, type }
   [handleSendMessage] Received: { channel_id, sender_id, message: "TEST123", type }
   [handleSendMessage] Broadcasting to channel: [channelId]
   ```

   **Frontend Console again:**
   ```
   [handleReceive] Raw socket message: { id, content: "TEST123", sender_id, username, created_at, channel_id }
   [handleReceive] Adding new message to cache: [message-id] TEST123, Total messages now: [count]
   ```

---

## Step 4: Identify the Break Point

**If you DON'T see:**

- ❌ `✅ Socket connected` → **Problem**: Socket not connecting
- ❌ `[ChatArea] Setting up socket listeners...` → **Problem**: ChatArea effect not running  
- ❌ `[handleSend] Adding temp message` → **Problem**: Message input component issue
- ❌ `[send_message event] Received data` on backend → **Problem**: Socket event not reaching backend
- ❌ `[handleSendMessage] Broadcasting...` on backend → **Problem**: Message save failed, check DB logs
- ❌ `[handleReceive] Raw socket message` on frontend → **Problem**: Socket broadcast not reaching client

---

## Step 5: Report the Issue

Tell me which point breaks. Paste the EXACT logs showing where it stops. This will pinpoint the exact problem.

Example report:
```
Backend shows: "[send_message event] Received data: ..."
Backend shows: "[handleSendMessage] Broadcasting to channel: [id]"
But Frontend NEVER shows: "[handleReceive] Raw socket message"
→ This means: Socket broadcast happening but frontend not receiving
```

---

## Common Issues & Fixes

### Issue: Message saves to DB but never reaches frontend
- Check: Did frontend show log "[handleReceive] Raw socket message"?
- Fix: Restart frontend to reload socket code

### Issue: Frontend never even emits send_message
- Check: Does browser have console errors?
- Fix: Check MessageInput component or socket connection

### Issue: Backend never receives send_message
- Check: Backend socket logs for "[send_message event]"
- Fix: Verify socket connection reached backend (check for connection log)

