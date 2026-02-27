# Mizuka Frontend

React + Vite chat frontend connecting to the Mizuka backend via REST API and Socket.io.

## Setup

```bash
cd mizuka-frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`  
Backend expected at `http://localhost:3000`

## Directory Structure

```
mizuka-frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root: auth state, channel selection
    ├── components/
    │   ├── LoginScreen.jsx   # Username entry screen
    │   ├── LoginScreen.css
    │   ├── Sidebar.jsx       # Channel list + user footer
    │   ├── Sidebar.css
    │   ├── ChatArea.jsx      # Socket logic, message state, fetch
    │   ├── ChatArea.css
    │   ├── ChatHeader.jsx    # Channel name + delete channel
    │   ├── ChatHeader.css
    │   ├── MessageList.jsx   # Renders messages + typing indicator
    │   ├── MessageList.css
    │   ├── MessageItem.jsx   # Single message bubble + delete
    │   ├── MessageItem.css
    │   ├── MessageInput.jsx  # Textarea, send, typing emit
    │   └── MessageInput.css
    ├── services/
    │   ├── socket.js         # Socket.io client singleton
    │   └── api.js            # Axios REST calls
    ├── utils/
    │   ├── auth.js           # localStorage auth helpers
    │   └── time.js           # Time/date formatters
    └── styles/
        ├── global.css        # CSS variables, resets, scrollbar
        └── app.css           # Top-level layout
```

## Socket Events

| Direction | Event | Payload |
|---|---|---|
| Emit | `join_institute` | `{ channelId }` |
| Emit | `send_message` | `{ channelId, content, userId, username }` |
| Emit | `typing` | `{ channelId, username }` |
| Emit | `stop_typing` | `{ channelId, username }` |
| Listen | `receive_message` | message object |
| Listen | `Display_typing` | `{ username }` |
| Listen | `stop_typing` | `{ username }` |