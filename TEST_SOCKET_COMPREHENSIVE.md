# Final Comprehensive Test Guide

## Start Here - Socket Communication Test

### Step 1: Clean Restart (VERY IMPORTANT!)

**Close ALL terminals and browser tabs.** Then:

```bash
# Terminal 1
cd backend
npm run server
```

Wait until you see:
```
Mizuka Engine Live on Port 3000
```

```bash
# Terminal 2
cd frontend  
npm run dev
```

Wait until you see:
```
  VITE v... ▶ http://localhost:5173/
```

### Step 2: Basic Socket Connection Test

1. Open **http://localhost:5173** in browser
2. Open **DevTools Console** (F12 → Console)
3. You should IMMEDIATELY see:
   ```
   ✅ Socket connected: [socket-id]
   ```
   
   - ✓ If you see this → **GOOD**, socket IS connecting
   - ✗ If you DON'T see this → **Problem**: Socket connection failing (check backend logs for errors)

### Step 3: Manual Socket Test

In the browser console, type:
```javascript
window.testSocket()
```

You should immediately see:
```
[testSocket] Sending test event...
✅ Test response from backend: { message: "Backend received your test!", timestamp: "..." }
```

- ✓ If you see response → **GOOD**, Socket.io communication works
- ✗ If you DON'T see response → **Problem**: Socket emit/receive not working

**If this test fails, the issue is fundamental socket communication - contact support**

---

## Step 4: Channel Message Flow Test

### 4a. Join a Channel

1. Click on any existing channel in the app
2. **Browser console** should show (within 2 seconds):
   ```
   [joinRoom] Socket already connected, joining room now
   [joinRoom] Emitting join_institute for room: [channelId]
   [ChatArea] *** REGISTERING SOCKET LISTENERS *** for Channel: [channelId]
   [ChatArea] Events: "receive_message", "Display_typing", "hide_typing"
   [ChatArea] *** LISTENERS REGISTERED *** socket has [N] event types listening
   ```

   - All 4 logs visible? → **GOOD**
   - Missing any? → **Problem**: Check which ones are missing

### 4b. Send Test Message

1. Type "TEST_MSG_123" in the message input
2. Press Enter or click Send
3. **Immediately watch browser console** for:

   ```
   [handleSend] Adding temp message: temp-[timestamp] TEST_MSG_123
   [handleSend] Emitting send_message: { channel_id, content: "TEST_MSG_123", sender_id }
   ```

   - See both logs? → Continue to next step
   - See only first? → **Problem**: Socket.emit() failing, check for errors
   - See neither? → **Problem**: handleSend() not being called

### 4c. Watch for Message Reception

Within 1-2 seconds you should see:
```
[handleReceive] *** RECEIVE EVENT FIRED ***
[handleReceive] *** RECEIVE EVENT FIRED *** { id, content: "TEST_MSG_123", sender_id, ... }
[handleReceive] Adding new message to cache: [id] TEST_MSG_123, Total messages now: [N]
```

- See these? → **Message SHOULD appear on screen**. If not, check UI rendering
- DON'T see "[handleReceive] *** RECEIVE EVENT FIRED ***"? → **CRITICAL PROBLEM**: Socket message never reached frontend

### 4d. Check Backend Logs

In Terminal 1 (backend), you should have seen:
```
[send_message event] Received data: { channel_id, message: "TEST_MSG_123", sender_id, username, type }
[handleSendMessage] Received: { channel_id, sender_id, message: "TEST_MSG_123", type }
[handleSendMessage] Broadcasting to channel: [channelId]
```

- See all three? → **Backend works**
- Missing any? → **Problem**: Check which line is missing

---

## Problem Diagnosis

### Symptom: Socket never connects (Step 2 fails)

**Cause**: Backend not running or CORS issue
**Fix:**
1. Check backend terminal - any errors?
2. Verify backend is on `http://localhost:3000`
3. Check FRONTEND_URL in `.env` file
4. Restart backend and frontend

### Symptom: Socket connects but test_response doesn't arrive (Step 3 fails)

**Cause**: Socket.io communication broken
**Fix:**
1. Try different transport: Edit `socket.js` and remove 'websocket'
2. Restart frontend
3. Try step 3 again

### Symptom: Listeners not registering (Step 4a shows too few logs)

**Cause**: ChatArea component or socket not working
**Fix:**
1. Check any console errors
2. Make sure you're viewing a channel page (not just sidebar)
3. Restart frontend

### Symptom: Message sends but receive event never fires (Step 4c fails)

**Cause**: Socket message is broadcast but not reaching client
**Fix:**
1. Verify backend logs show "Broadcasting to channel" 
2. Try Step 3 (manual test) again
3. Restart both servers
4. Check browser Network tab → WebSocket connection status

---

## Report Template

When asking for help, provide:

```
### Socket Connection Test
- [ ] Step 2: See "✅ Socket connected" in console?
- [ ] Step 3: See test_response from backend?

### Channel Message Test (after joining channel)
- [ ] Step 4a: See all join/listener logs?
- [ ] Step 4b: See handleSend logs when sending message?
- [ ] Step 4c: See handleReceive logs?,
- [ ] Step 4d: See backend[handleSendMessage] logs?

### What breaks:
[Tell which step fails and what logs you see]

### Backend logs when you send message:
[Paste exact backend console output]

### Frontend logs when you send message:
[Paste exact frontend console output]
```

---

## Expected Behavior When Fixed

1. Temp message appears immediately (before server response)
2. Within 1-2 seconds, temp message is replaced with real message ID
3. Message stays on screen
4. Other users in channel see message immediately

If this isn't happening, follow the diagnostic steps above.
