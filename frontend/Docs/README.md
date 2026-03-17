# Mizuka Connect — Frontend

React + Vite frontend for the Mizuka Connect chat platform. Real-time messaging, direct messages, institute management, and profile pictures.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Bundler | Vite |
| Realtime | Socket.io client |
| HTTP | Axios |
| Icons | Lucide React |
| Fonts | Sora (sans), DM Mono (mono) |
| Styling | Custom CSS with CSS variables |

## Project Structure

```
src/
├── main.jsx
├── App.jsx                         # Root layout, routing, active state
├── pages/
│   └── LoginPage.jsx               # Login + register
├── components/
│   ├── Sidebar.jsx                 # Navigation, channels, inbox tab
│   ├── Inbox.jsx                   # Direct messages list + member search
│   ├── ChatArea.jsx                # Channel + P2P chat container
│   ├── ChatHeader.jsx              # Channel / DM header with rename + delete
│   ├── MessageList.jsx             # Scrollable message list
│   ├── MessageItem.jsx             # Single message (avatar, actions, copy, edit, delete)
│   ├── MessageInput.jsx            # Textarea with send + cancel
│   ├── ChatSkelton.jsx             # Loading skeleton
│   ├── UserProfilePanel.jsx        # Own profile panel (edit username, upload photo)
│   ├── UserProfilePopover.jsx      # Other user's profile popover + DM button
│   ├── InstituteSidebar.jsx        # Institute management panel
│   ├── InstituteGate.jsx           # Create / join institute gate
│   ├── CreateChannelModal.jsx      # Create channel modal
│   ├── ChangePasswordModal.jsx     # Change password modal
│   ├── Avatar.jsx                  # Reusable avatar (image or initials)
│   └── Toast.jsx                   # Toast notification
├── services/
│   ├── api.js                      # Axios instance + all API calls
│   ├── p2p-api.js                  # P2P-specific API calls
│   ├── socket.js                   # Socket.io singleton
│   └── AuthContext.jsx             # Auth state, login, logout, updateUser
├── utils/
│   ├── time.js                     # formatTime helper
│   └── dateFormat.js               # resolveTimestamp, formatDate, isSameDay
└── styles/
    ├── globals.css                 # CSS variables, reset, scrollbar
    ├── app.css                     # App layout
    └── Toast.css                   # Toast + waking banner
```

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:3000/api
```

For production point this at your deployed backend URL.

## Key Features

### Authentication
- JWT stored in `localStorage` under `mizuka_token`
- User object stored in `localStorage` under `mizuka_user`
- `AuthContext` hydrates `profile_picture` on mount by re-fetching `/auth/user-info` — ensures fresh data across sessions and devices
- `updateUser(fields)` exposed on context to merge updates without re-login

### Institutes & Channels
- Users belong to one or more institutes
- Each institute has channels
- Admins can create, rename, and delete channels in real time
- Active institute persisted in `localStorage`

### Real-time Messaging
- Channel messages via Socket.io room per channel
- Typing indicators for both channels and DMs
- Message cache per channel/room (clears on navigation, refetches fresh)
- Optimistic temp messages replaced when server confirms

### Direct Messages (P2P)
- DM rooms fetched from backend on mount — recent chats always visible regardless of device or cleared storage
- `localStorage` used as a cache layer, backend is the source of truth
- Unread badge counts per room, cleared when room is opened
- Inbox auto-switches to DM tab when a conversation is opened from anywhere

### Profile Pictures
- Uploaded via `PUT /auth/update-profile` as `multipart/form-data`
- Cloudinary URL stored in `users.profile_picture`
- Appears in: sidebar footer, inbox recent chats, message avatars (own + others), chat header (DM), profile popover
- `AuthContext.updateUser({ profile_picture })` updates everywhere live after upload

### Message Actions
- **Desktop**: Copy, Edit, Delete appear on hover for own messages; Copy on hover for others
- **Mobile**: Three-dot menu opens a context menu with Copy / Edit / Delete
- Copy shows a toast notification on success
- Edit inline with `Enter` to save, `Escape` to cancel

### Mobile
- Sidebar slides in as an overlay with backdrop
- `font-size: 16px` on all inputs prevents iOS Safari auto-zoom
- Touch-friendly tap targets (min 44–56px)
- Message input hint hidden on mobile to save space

## CSS Design System

All values come from CSS variables in `globals.css`:

```css
/* Backgrounds — warm off-white */
--bg-base:    #dedad4;
--bg-surface: #e4e0da;
--bg-panel:   #ede9e3;
--bg-hover:   #d4cfc8;
--bg-input:   #d8d3cc;

/* Accent — teal */
--accent: #0d9488;  /* teal-600 */

/* Typography */
--font-sans: 'Sora', sans-serif;
--font-mono: 'DM Mono', monospace;
--text-primary:   #1a1a1a;
--text-secondary: #363636;
--text-muted:     #5e5e5e;
--text-ghost:     #8f8f8f;
```

## Installation

```bash
cd frontend
npm install
```

## Running

```bash
npm run dev
```

## Building

```bash
npm run build
```