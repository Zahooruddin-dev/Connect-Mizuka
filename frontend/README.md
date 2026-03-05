# Mizuka Frontend — Technical Reference

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Directory Structure](#directory-structure)
5. [Design System](#design-system)
6. [Application Flow](#application-flow)
7. [Authentication Flow](#authentication-flow)
8. [Institute Flow](#institute-flow)
9. [Real-Time Messaging Flow](#real-time-messaging-flow)
10. [User Profile Popover](#user-profile-popover)
11. [File-by-File Reference](#file-by-file-reference)
12. [Socket Event Contract](#socket-event-contract)
13. [REST API Contract](#rest-api-contract)
14. [localStorage Keys](#localstorage-keys)
15. [Message Shape Reference](#message-shape-reference)
16. [Role-Based Behaviour](#role-based-behaviour)
17. [Known Test Data](#known-test-data)
18. [Common Pitfalls & Debug Notes](#common-pitfalls--debug-notes)

---

## Overview

Mizuka is a real-time institutional chat application. The frontend is a React + Vite SPA that communicates with a Node/Express backend over two transports:

- **HTTP REST** via axios — for auth, institute linking, history fetches, and delete operations.
- **WebSocket (Socket.io)** — for live message delivery and typing indicators, routed through the Vite dev proxy.

The UI is vanilla CSS with a dark teal theme. No CSS framework is used. All design tokens are CSS custom properties defined once in `global.css`.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| HTTP client | axios |
| WebSocket client | socket.io-client 4 |
| Styling | Vanilla CSS + CSS custom properties |
| Fonts | Sora (sans-serif), DM Mono (monospace) — Google Fonts |
| Auth & institute state | React Context + `localStorage` |
| State management | `useState` / `useContext` — no external library |

---

## Getting Started

```bash
cd mizuka-frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. The backend must be running on `http://localhost:3000` before the app is useful.

> **After editing `vite.config.js` always restart the dev server** — proxy config is only read at startup.

---

## Directory Structure

```
mizuka-frontend/
├── index.html
├── vite.config.js
├── package.json
├── FRONTEND.md                         ← this file
└── src/
    ├── main.jsx                        ← React root, wraps app in AuthProvider
    ├── App.jsx                         ← Three-state route guard + layout shell
    │
    ├── pages/
    │   ├── LoginPage.jsx               ← Login, register, forgot password, reset
    │   └── LoginPage.css
    │
    ├── components/
    │   ├── InstituteGate.jsx           ← Full-screen "join an institute" wall
    │   ├── InstituteGate.css
    │   ├── InstitutePanel.jsx          ← Slide-in panel: list/add/switch/leave institutes
    │   ├── InstitutePanel.css
    │   ├── Sidebar.jsx                 ← Channel list + institute switcher + user footer
    │   ├── Sidebar.css
    │   ├── ChatArea.jsx                ← Socket logic, message state, channel fetch
    │   ├── ChatArea.css
    │   ├── ChatHeader.jsx              ← Channel name bar + admin delete
    │   ├── ChatHeader.css
    │   ├── MessageList.jsx             ← Scrollable messages + typing indicator + popover state
    │   ├── MessageList.css
    │   ├── MessageItem.jsx             ← Single message + clickable avatar/username
    │   ├── MessageItem.css
    │   ├── MessageInput.jsx            ← Textarea, send button, typing emit logic
    │   ├── MessageInput.css
    │   ├── UserProfilePopover.jsx      ← Centered modal for viewing user profiles
    │   ├── UserProfilePanel.jsx        ← Full editable profile for logged-in user
    │   ├── styles/
    │   │   ├── UserProfilePopover.css  ← Popover modal styling
    │   │   └── UserProfilePanel.css
    │   └── Institutepanel.jsx
    │
    ├── services/
    │   ├── AuthContext.jsx             ← Context: user, token, institutes, all actions
    │   ├── api.js                      ← All HTTP calls + JWT interceptor
    │   └── socket.js                   ← socket.io-client singleton
    │
    ├── utils/
    │   ├── time.js                     ← formatTime(), formatDate()
    │   └── dateFormat.js               ← Extended: isSameDay(), long-form formatDate()
    │
    └── styles/
        ├── global.css                  ← CSS variables, reset, scrollbar, base typography
        └── app.css                     ← .app-layout flex container
```

> Files not listed are legacy scaffolding. Do not mount `ChatWindow` — use `ChatArea` exclusively.

---

## Design System

All visual tokens live in `src/styles/global.css` as CSS custom properties, available to every component without imports.

### Colour Palette

```css
/* Teal scale */
--teal-300: #5eead4    /* Active channel text, bright highlights */
--teal-400: #2dd4bf    /* Brand accent, glow, status dot */
--teal-500: #14b8a6    /* Interactive elements, hover links */
--teal-600: #0d9488    /* Button backgrounds, primary CTAs */
--teal-700: #0f766e    /* Own message bubbles */
--teal-800: #115e59    /* Scrollbar thumb, deep accents */
--teal-900: #134e4a    /* Darkest accents */

/* Amber — used sparingly */
--accent:       #f0a500
--accent-light: #ffd166
--accent-dim:   rgba(240, 165, 0, 0.15)

/* Backgrounds */
--bg-base:    #0b1512   /* Page background */
--bg-surface: #111f1c   /* Sidebar, header, login card */
--bg-panel:   #152421   /* Others' message bubbles */
--bg-hover:   #1c2f2b   /* Hover states */
--bg-input:   #0e1a18   /* All input fields */

/* Borders */
--border:        rgba(45, 212, 191, 0.12)
--border-strong: rgba(45, 212, 191, 0.25)

/* Text */
--text-primary:   #e2faf7   /* Main body text */
--text-secondary: #8ecec8   /* Labels, secondary info */
--text-muted:     #4a8a83   /* Placeholders, hints */
--text-ghost:     #2a5955   /* Disabled / very subtle text */
```

### Typography

```css
--font-sans: 'Sora', sans-serif       /* All UI text */
--font-mono: 'DM Mono', monospace     /* Hash symbols, UUID inputs, timestamps */
```

### Shape & Shadow

```css
--radius-sm: 6px    /* Buttons, chips */
--radius-md: 10px   /* Inputs, cards */
--radius-lg: 16px   /* Message bubbles */
--radius-xl: 22px   /* Login card, institute card */

--shadow-sm:   0 2px 8px rgba(0,0,0,0.4)
--shadow-md:   0 4px 20px rgba(0,0,0,0.5)
--shadow-glow: 0 0 24px rgba(20,184,166,0.15)   /* Teal ambient glow */
```

---

## Application Flow

`App.jsx` implements a three-state router driven purely by React context — no URL routing library is used.

```
main.jsx
└── <AuthProvider>
     └── <App>
          │
          ├── user === null
          │    └── <LoginPage>
          │
          ├── institutes.length === 0  OR  activeInstitute === null
          │    └── <InstituteGate>
          │
          └── user + activeInstitute both exist
               ├── <Sidebar>
               │    └── [opens] <InstitutePanel>
               └── <ChatArea key=channelId>
                    ├── <ChatHeader>
                    ├── <MessageList>
                    │    ├── <MessageItem> × N
                    │    └── [conditional] <UserProfilePopover>
                    └── <MessageInput>
```

### Channel Switching

When a channel is clicked in `Sidebar`, `App` updates `activeChannel` with the full `{ id, label }` object. Because `ChatArea` carries `key={channelId}`, React **fully unmounts and remounts** it on every switch — cleaning up socket listeners, emitting `leave_institute` for the old room, re-emitting `join_institute` for the new room, and re-fetching history from scratch.

### Institute Switching

Selecting a different institute in `InstitutePanel` calls `setActiveInstitute()`, persists to `localStorage`, and causes `App` to re-render. `activeChannel` resets to `null`, so `ChatArea` mounts against the new institute's default channel.

---

## Authentication Flow

```
User submits email + password
        │
        ▼
LoginPage → api.login() → POST /api/auth/login
        │
        ├── { token, user } received
        │     └── AuthContext.login(user, token)
        │           ├── Persists: mizuka_user, mizuka_token
        │           ├── If user.institute_id exists → seeds institutes list
        │           └── React state updates → App re-renders
        │
        └── Error response → inline error shown in form
```

On page reload, `AuthContext` reads `localStorage` synchronously inside `useState` initialisers — no flash of the login screen for already-authenticated users.

**JWT interceptor:** Every axios request automatically receives `Authorization: Bearer <token>` via a request interceptor in `api.js`. No manual header passing is needed at any call site.

---

## Institute Flow

### Registration — no institute required

```
User fills username + email + password + role  (no institute_id field)
        │
        ▼
api.register() → POST /api/auth/register  { institute_id: '' }
  └── Backend stores NULL in users.institute_id
  └── Success → switch to LOGIN view with success message
```

> **Note:** The `users` table has a `role` check constraint. Only `'member'` and `'admin'` are valid values. The register form must not send any other role string, or the insert will fail with a constraint violation.

### First login — no institute

```
User logs in → institutes[] is empty → App renders <InstituteGate>

User pastes Institute UUID + optional nickname
  └── api.linkToInstitute(user.id, instituteId)
        └── POST /api/auth/link-to-institute → backend inserts into user_institutes
        └── On success → AuthContext.addInstitute({ id, label })
              └── Persists: mizuka_institutes, mizuka_active_institute
              └── App re-renders → gate disappears → chat shown
```

### Adding a second institute

```
Sidebar institute button clicked → InstitutePanel opens
User clicks "Add institute" → inline form expands
User pastes UUID → api.linkToInstitute() called
  └── On success → AuthContext.addInstitute() appends to institutes[]
```

### Switching active institute

```
User clicks any institute row in InstitutePanel
  └── AuthContext.setActiveInstitute(institute)
        └── mizuka_active_institute updated in localStorage
        └── Panel closes → Sidebar shows new institute's channels
```

### Leaving an institute (frontend-only)

```
User hovers institute row → leave button appears
User confirms leave modal
  └── AuthContext.removeInstitute(id)
        └── Filtered from institutes[] in localStorage
        └── If it was active → next institute becomes active
        └── No backend call is made (UI-only for now)
```

---

## Real-Time Messaging Flow

### Socket connection

The socket connects to `http://localhost:5173` (the Vite dev server) with `transports: ['websocket']`. The `/socket.io` proxy rule in `vite.config.js` forwards it to `http://localhost:3000`. Connecting directly to port 3000 from port 5173 is cross-origin and causes 400 errors when Socket.io's polling handshake fails CORS checks — the proxy eliminates this entirely.

### Sending

```
User types → MessageInput.handleChange()
  ├── First keystroke: typingRef = true, emit 'typing'
  └── Restart 2-second idle timer on every keystroke

User presses Enter or clicks Send
  ├── Clear idle timer, emit 'stop_typing'
  └── ChatArea.handleSend()
        ├── Adds message OPTIMISTICALLY to local state immediately
        │     { id: `temp-${Date.now()}`, content, sender_id, username, created_at }
        └── socket.emit('send_message', {
              channel_id,
              message,      ← backend destructures as 'message' not 'content'
              sender_id,    ← backend destructures as 'sender_id' not 'userId'
              username
            })
```

### Receiving

```
Backend saves to DB, broadcasts:
  { id, text, from, username, timestamp, channel_id }
        │
        ▼
ChatArea.handleReceive() filters:
  ├── Drops if msg.channel_id !== current channelId  (cross-channel guard)
  └── Drops if msg.from === user.id                  (own message, already added optimistically)

Then normalises:
  {
    id:         msg.id,
    content:    msg.text     ?? msg.content,
    sender_id:  msg.from     ?? msg.sender_id,
    username:   msg.username,
    created_at: msg.timestamp ?? msg.created_at
  }
        │
        ▼
setMessages(prev => {
  if (prev.some(m => m.id === normalised.id)) return prev  // deduplicate
  return [...prev, normalised]
})
  └── MessageList scrolls to bottom → MessageItem renders
```

### Typing indicators

```
Remote user starts typing → backend emits 'Display_typing' { username, channel_id }
  └── Ignored if channel_id !== current channelId
  └── Otherwise: username added to typingUsers[]

Remote user stops / sends → backend emits 'hide_typing' { channel_id }
  └── Ignored if channel_id !== current channelId
  └── Otherwise: typingUsers[] cleared

Local user is always filtered: typingUsers.filter(u => u !== user.username)
```

### Room lifecycle

```
ChatArea mounts (channelId changes)
  └── emit 'join_institute', channelId   ← raw UUID string

ChatArea unmounts (channel switch or logout)
  └── emit 'leave_institute', channelId  ← explicitly leaves the old socket room
  └── All three socket listeners removed via socket.off()
```

> **Critical:** Always pass `channelId` as the raw UUID string to `join_institute` and `leave_institute`. Passing an object will join/leave a room literally named `[object Object]`.

---

## User Profile Popover

### Overview

Clicking a user's avatar or username in `MessageItem` opens a centered modal showing that user's profile. The popover is read-only and displays email, role, and member-since date. It includes action buttons for @Mention (functional placeholder) and Direct Message (disabled).

### Component Structure

**UserProfilePopover.jsx** — centered modal component

```jsx
<UserProfilePopover
  userId={selectedUser}
  onClose={handleClosePopover}
/>
```

Props:
- `userId` (string) — user ID to fetch and display
- `onClose` (function) — callback to close popover

State:
- `user` — fetched user object with id, username, email, role, created_at
- `loading` — boolean for async fetch state

**UserProfilePopover.css** — modal styling

- Fixed overlay with dark backdrop and blur
- Centered card constrained to max-width 420px
- Slide-up entrance animation
- Custom scrollbar matching theme
- Responsive padding

### Data Flow

```
User clicks avatar or username in MessageItem
        │
        ▼
MessageItem.handleUserClick(senderId)
        │
        ▼
MessageList.handleUserClick(userId)
  └── setSelectedUser(userId)
        │
        ▼
MessageList renders <UserProfilePopover userId={...} onClose={...}>
        │
        ▼
UserProfilePopover.useEffect()
  └── Calls api.getUserProfile(userId)
        └── GET /api/auth/user-profile/:userId
              └── Returns { user: { id, username, email, role, created_at } }
        │
        ▼
setUser(data.user)
        │
        ▼
Popover renders user info centered on screen
        │
User clicks close button or backdrop
        │
        ▼
MessageList.handleClosePopover()
  └── setSelectedUser(null)
        │
        ▼
Popover unmounts
```

### Integration Points

**MessageList.jsx** — manages popover state

```jsx
const [selectedUser, setSelectedUser] = useState(null)

const handleUserClick = (userId) => {
  setSelectedUser(userId)
}

const handleClosePopover = () => {
  setSelectedUser(null)
}

// Later in render:
{selectedUser && (
  <UserProfilePopover
    userId={selectedUser}
    onClose={handleClosePopover}
  />
)}
```

**MessageItem.jsx** — clickable avatar and username

```jsx
<button
  className="message-avatar-btn"
  onClick={handleUserClick}
  title={`View ${message.username}'s profile`}
>
  {/* avatar */}
</button>

<button
  className="message-author-btn"
  onClick={handleUserClick}
  title={`View ${message.username}'s profile`}
>
  {message.username}
</button>
```

**api.js** — new function

```jsx
export const getUserProfile = async (userId) => {
	try {
		const res = await api.get(`/auth/user-profile/${userId}`);
		return res.data;
	} catch (err) {
		return { message: 'User not found' };
	}
};
```

**Backend requirement** — GET `/api/auth/user-profile/:userId`

Endpoint must return:
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "admin|member",
    "created_at": "ISO8601 timestamp"
  }
}
```

### Styling Details

**Layout:**
- Fixed overlay spans full viewport (z-index 2000)
- Dark backdrop with blur filter prevents interaction with elements behind
- Card centered using flexbox `align-items: center` + `justify-content: center`
- Max-width 420px, responsive on mobile with padding

**Header section:**
- User avatar 64px, gradient teal background
- Username displayed at 18px, bold
- Role shown as uppercase 12px teal text
- Close button (X icon) top-right, hover effect

**Info section:**
- Email and "Member Since" in labeled groups
- Each group has uppercase 11px label + 14px value
- Separator line between groups
- Scrollable if content exceeds viewport (max-height 70vh)

**Actions section:**
- Two buttons: @Mention (interactive) and Direct Message (disabled)
- Hover state: teal border and text, semi-transparent teal background
- Disabled state: 50% opacity

**Animations:**
- Overlay fades in 0.2s ease-out
- Card slides up + fades in 0.3s cubic-bezier(0.16, 1, 0.3, 1)

---

## File-by-File Reference

### `src/main.jsx`

React root. Wraps `<App>` in `<AuthProvider>`. Imports `global.css` before any component CSS so variables are available everywhere.

### `src/App.jsx`

Three-state route guard. `activeChannel` resets to `null` when the institute changes. `effectiveChannel` falls back to `{ id: activeInstitute.id, label: 'general' }` when `activeChannel` is null.

### `src/pages/LoginPage.jsx`

Four views in one component controlled by a `view` state string. All views share one `form` state object; unused fields stay empty and are ignored.

| View | Fields | API call | On success |
|---|---|---|---|
| `LOGIN` | email, password | `api.login()` | `authLogin()` → App re-renders |
| `REGISTER` | username, email, password, role | `api.register()` | Message → switch to LOGIN |
| `RESET_REQ` | email | `api.requestPasswordReset()` | Switch to RESET_CONFIRM |
| `RESET_CONFIRM` | code, newPassword | `api.resetPassword()` | Message → switch to LOGIN |

No `institute_id` field. Register sends `''` which the backend accepts as `NULL`. Role dropdown only offers `member` and `admin` — these are the only values allowed by the database constraint.

### `src/components/InstituteGate.jsx`

Full-screen wall for users with no institutes. Shows personalised greeting with username. Calls `api.linkToInstitute()` before updating local state — if the backend rejects the ID, the error shows inline and local state is not updated. Sign-out link at the bottom.

### `src/components/InstitutePanel.jsx`

Side-sheet that slides in from the left over the sidebar. Keyboard: Escape closes, backdrop click closes, all elements have `focus-visible` outlines.

| Interaction | Behaviour |
|---|---|
| Click institute row | `setActiveInstitute()` → closes |
| Hover row | Leave button fades in |
| Click leave | Confirmation modal (UI-only, no backend call) |
| Click "Add institute" | Inline form expands |
| Submit add form | `api.linkToInstitute()` → `addInstitute()` on success |

### `src/components/Sidebar.jsx`

240px fixed-width left panel. Sections from top to bottom:

1. **Header** — brand + animated teal status dot.
2. **Institute switcher button** — initial icon + label + "click to manage" hint. Opens `InstitutePanel`. `aria-haspopup="dialog"`.
3. **Channel list** — driven by `CHANNELS_BY_INSTITUTE` lookup keyed by institute UUID. Falls back to `[{ id: instituteId, label: 'general' }]` for unknown IDs. Shows italic placeholder when no active institute.
4. **Footer** — avatar initial, username, role badge, sign-out button.

`InstitutePanel` renders as a sibling of `<aside>` to avoid z-index stacking issues.

### `src/components/ChatArea.jsx`

Owns all socket listeners and message state for the active channel. Key props: `channelId`, `channelLabel`, `user`.

**On mount:** resets state → emits `join_institute` → fetches history → registers three socket listeners.

**On unmount / channel change:** emits `leave_institute` for the old room → removes all three socket listeners.

All socket emit functions are `useCallback`-memoised. An `activeChannelRef` guards against stale fetch responses arriving after a fast channel switch.

**Optimistic sends:** `handleSend` adds the message to local state immediately with a `temp-` prefixed id before emitting to the server. The server's `receive_message` echo is dropped for the sender's own messages (filtered by `sender_id`), preventing duplicates.

**Critical:** `send_message` payload must use `message` and `sender_id` — these are the field names the backend socket controller destructures.

### `src/components/ChatHeader.jsx`

Shows `#channelLabel`. Admin users (`user.role === 'admin'`) see a "Delete channel" button requiring two-click confirmation. Calls `deleteChannel(channelId, user.id)`. On success calls `onChannelDeleted()` to clear the message list.

### `src/components/MessageList.jsx`

Renders all `MessageItem` components, a typing indicator row, and conditionally a `UserProfilePopover`. Auto-scrolls to a `ref` div at the bottom on every `messages` or `typingUsers` change.

Manages `selectedUser` state:
- `handleUserClick(userId)` sets the selected user
- `handleClosePopover()` clears it
- Conditional render of `<UserProfilePopover>` when `selectedUser` is not null

### `src/components/MessageItem.jsx`

Detects ownership via `message.sender_id || message.userId || message.user_id` compared to `currentUserId`. Own messages are right-aligned teal bubbles with a hover-reveal delete button. Others' messages are left-aligned with a sender name above and an avatar showing the first letter of `username`.

Avatar and username are now clickable buttons that call `onUserClick(senderId)` to trigger popover display.

Delete calls `deleteMessage(msgId, currentUserId)` which sends `{ userId }` in the DELETE body.

### `src/components/MessageInput.jsx`

Textarea with send button. Uses a `ref` (not state) for the typing flag to avoid re-renders. Emits `typing` on first keystroke, restarts a 2-second timer on every keystroke, emits `stop_typing` when the timer fires or when a message is sent. `Enter` sends; `Shift+Enter` inserts newline.

### `src/components/UserProfilePopover.jsx`

Centered modal overlay for viewing user profiles read-only. Fetches user data from `/api/auth/user-profile/:userId`. Displays avatar, username, role, email, join date, and action buttons. Closes on backdrop click, close button, or when `onClose` is called.

Props:
- `userId` (string) — user ID to fetch
- `onClose` (function) — callback when user dismisses popover

### `src/services/AuthContext.jsx`

All auth and institute state in one context. Everything is synchronously hydrated from `localStorage` on load.

| Value | Type | Description |
|---|---|---|
| `user` | `object \| null` | `{ id, email, username, role, institute_id, createdAt }` |
| `token` | `string \| null` | JWT |
| `institutes` | `array` | `[{ id, label }, …]` |
| `activeInstitute` | `object \| null` | Currently selected `{ id, label }` |
| `login(user, token)` | fn | Sets state + persists. Seeds institutes from `user.institute_id` if present. |
| `logout()` | fn | Clears all state and all four localStorage keys |
| `addInstitute(inst)` | fn | Appends. Sets as active if none exists. |
| `removeInstitute(id)` | fn | Filters. Promotes next if it was active. |
| `setActiveInstitute(inst)` | fn | Updates active + persists |

### `src/services/api.js`

Axios instance at `http://localhost:3000/api`, 10s timeout. JWT interceptor injects `Authorization: Bearer` on every request. All auth functions return error response data as a plain object on failure — they never throw.

| Function | Method | Endpoint |
|---|---|---|
| `login(email, password)` | POST | `/auth/login` |
| `register(username, email, password, role, institute_id)` | POST | `/auth/register` |
| `requestPasswordReset(email)` | POST | `/auth/request-reset` |
| `resetPassword(email, code, newPassword)` | POST | `/auth/reset-password` |
| `linkToInstitute(userId, instituteId)` | POST | `/auth/link-to-institute` |
| `getUserProfile(userId)` | GET | `/auth/user-profile/:userId` |
| `fetchMessages(channelId, limit, offset)` | GET | `/messages/:channelId` |
| `deleteMessage(messageId, userId)` | DELETE | `/messages/message/:messageId` |
| `deleteChannel(channelId, userId)` | DELETE | `/messages/channel/:channelId` |

### `src/services/socket.js`

Module-level singleton. Connects to `http://localhost:5173` (Vite dev server) with `transports: ['websocket']`. The Vite proxy handles the WebSocket upgrade through to port 3000. `reconnectionAttempts: 5`, `reconnectionDelay: 1000ms`.

### `src/utils/time.js` and `src/utils/dateFormat.js`

`time.js` exports `formatTime()` and `formatDate()` (short form — used by `MessageItem`). `dateFormat.js` exports the same plus `isSameDay()` and a long-form `formatDate()` — available for date divider logic if implemented.

### `src/styles/global.css`

Loaded once before all component CSS. Defines all CSS variables, universal reset, full-height `html/body/#root`, `overflow: hidden` on body, 4px webkit scrollbar, base font on form elements, and `cursor: pointer` on buttons.

### `src/styles/app.css`

One rule: `.app-layout { display: flex; height: 100vh; width: 100vw; overflow: hidden; }` — makes sidebar and chat sit side by side at full height.

---

## Socket Event Contract

### Emitted by frontend

| Event | Payload | Where |
|---|---|---|
| `join_institute` | `channelId` (raw UUID string) | `ChatArea` on mount |
| `leave_institute` | `channelId` (raw UUID string) | `ChatArea` cleanup on unmount / channel change |
| `send_message` | `{ channel_id, message, sender_id, username }` | `ChatArea.handleSend` |
| `typing` | `{ channel_id, username }` | `MessageInput` on first keystroke |
| `stop_typing` | `{ channel_id, username }` | `MessageInput` after 2s idle or on send |

### Listened by frontend

| Event | Payload | Handler |
|---|---|---|
| `receive_message` | `{ id, text, from, username, timestamp, channel_id }` | Filtered by channel, deduplicated, normalised → appended to `messages[]` |
| `Display_typing` | `{ username, channel_id }` | Filtered by channel → added to `typingUsers[]` |
| `hide_typing` | `{ channel_id }` | Filtered by channel → `typingUsers[]` cleared |

---

## REST API Contract

All requests go to `http://localhost:3000/api`. JWT sent as `Authorization: Bearer <token>` via interceptor.

### Auth — `/api/auth/`

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/register` | `{ username, email, password, role, institute_id }` | `{ user }` |
| POST | `/auth/request-reset` | `{ email }` | `{ message }` |
| POST | `/auth/reset-password` | `{ email, code, newPassword }` | `{ message: 'reset password done' }` |
| POST | `/auth/link-to-institute` | `{ userId, institute_id }` | `{ message, membership }` |
| GET | `/auth/user-profile/:userId` | — | `{ user: { id, username, email, role, created_at } }` |

### Messages — `/api/messages/`

| Method | Path | Params / Body | Success |
|---|---|---|---|
| GET | `/messages/:channelId` | query: `limit`, `offset` | Array of message objects |
| DELETE | `/messages/message/:messageId` | body: `{ userId }` | `{ message: 'Message deleted successfully' }` |
| DELETE | `/messages/channel/:channelId` | body: `{ userId }` | `{ message: 'Channel deleted successfully' }` |

---

## localStorage Keys

| Key | Contents |
|---|---|
| `mizuka_user` | JSON — `{ id, email, username, role, institute_id, createdAt }` |
| `mizuka_token` | JWT string |
| `mizuka_institutes` | JSON array — `[{ id: UUID, label: string }, …]` |
| `mizuka_active_institute` | JSON object — `{ id: UUID, label: string }` |

All four are removed on `logout()`.

---

## Message Shape Reference

### From REST (`GET /messages/:channelId`)

```js
{
  id:         "uuid",
  content:    "hello world",
  sender_id:  "uuid",
  username:   "hiroshi",
  channel_id: "uuid",
  created_at: "2025-03-12T14:22:00.000Z"
}
```

### From socket (`receive_message` event)

```js
{
  id:        "uuid",
  text:      "hello world",      // ← 'text' not 'content'
  from:      "uuid",             // ← 'from' not 'sender_id'
  username:  "hiroshi",          // ← included since backend fix
  timestamp: "2025-03-12T…",     // ← 'timestamp' not 'created_at'
  channel_id: "uuid"             // ← used for cross-channel filtering
}
```

### After normalisation in `ChatArea.handleReceive()`

```js
{
  id:         "uuid",
  content:    "hello world",     // resolved: text ?? content
  sender_id:  "uuid",            // resolved: from ?? sender_id
  username:   "hiroshi",
  created_at: "2025-03-12T…"     // resolved: timestamp ?? created_at
}
```

### Optimistic (own sent messages)

```js
{
  id:         "temp-1712345678900",   // temporary — replaced on next history fetch
  content:    "hello world",
  sender_id:  "uuid",
  username:   "hiroshi",
  created_at: "2025-03-12T…"
}
```

---

## Role-Based Behaviour

| Feature | `member` | `admin` |
|---|---|---|
| Send messages | ✅ | ✅ |
| Delete own messages | ✅ | ✅ |
| Delete others' messages | ❌ 403 | ❌ 403 |
| See "Delete channel" button | ❌ hidden | ✅ visible |
| Delete all channel messages | ❌ 403 | ✅ |

Role is read from `AuthContext.user.role`. The frontend hides/shows UI based on it; the backend enforces the actual permission on every request independently.

---

## Known Test Data

| Item | Value |
|---|---|
| Test institute ID | `1c8fb7e7-5e07-409d-8245-19b4b834028c` |
| Main Hallway channel UUID | `c1111111-1111-1111-1111-111111111111` |
| Faculty Lounge channel UUID | `c2222222-2222-2222-2222-222222222222` |

These UUIDs are hardcoded in `Sidebar.jsx`'s `CHANNELS_BY_INSTITUTE` map.

---

## Common Pitfalls & Debug Notes

### 400 Bad Request on socket polling

`GET /socket.io/?EIO=4&transport=polling… 400 (Bad Request)` in browser console. Messages don't send.

The socket client was connecting directly to `localhost:3000` from `localhost:5173` — cross-origin. Socket.io's polling handshake fails CORS in this scenario.

Fix: `socket.js` must connect to `http://localhost:5173` with `transports: ['websocket']`. The Vite proxy routes `/socket.io` through to port 3000. Restart the dev server after any `vite.config.js` change.

---

### Messages appearing in wrong channel

Messages sent in channel A briefly appear in channel B when switching quickly.

Root cause: the socket was never leaving the old room on channel switch, so both rooms' `receive_message` events fired. Fixed by emitting `leave_institute` in `ChatArea`'s cleanup function, and by including `channel_id` in every socket event payload so the frontend can filter any stale events that slip through.

---

### Typing indicator showing in all channels

A user typing in channel A causes the typing indicator to flash in channel B.

Root cause: `Display_typing` and `hide_typing` previously carried no channel context, so they fired globally. Fixed by including `channel_id` in both events on the backend, and by checking it before updating `typingUsers[]` in `ChatArea`.

---

### Duplicate messages / `?` avatar on own messages

Own sent messages appeared twice — once with the correct avatar and once with `?`.

Root cause: the server echoes `receive_message` back to the sender, but the sender also adds the message optimistically. The duplicate check kept the first (incomplete) copy. Fixed by: (1) adding messages optimistically with full user data in `handleSend`, and (2) dropping `receive_message` events where `msg.from === user.id`.

---

### Messages not reaching the DB

The message appears to send but nothing is saved. The backend socket controller destructures `const { channel_id, sender_id, message } = data`. If the frontend sends `content` or `userId` instead, the values arrive as `undefined` and the DB insert silently fails.

Correct emit payload:
```js
socket.emit('send_message', {
  channel_id: channelId,
  message:    content,     // must be 'message'
  sender_id:  user.id,     // must be 'sender_id'
  username:   user.username
})
```

---

### Messages appear blank after receiving

The `receive_message` event uses `text`, `from`, `timestamp` but `MessageItem` reads `content`, `sender_id`, `created_at`. The normalisation step in `ChatArea.handleReceive()` bridges this gap. Do not bypass it.

---

### Register fails with constraint violation

`new row for relation "users" violates check constraint "users_role_check"`.

The `users` table only allows `role IN ('member', 'admin')`. Sending any other string (e.g. `'teacher'`, `'moderator'`) from the register form will cause this error. Keep the role select to those two values only. Per-institute roles (teacher, moderator, etc.) belong in the `user_institutes` junction table, not on the `users` row.

---

### Delete fails with 403

Axios DELETE requests need `{ data: { userId } }` to send a body — using `{ body: ... }` is silently ignored by axios. Also verify `deleteChannel` is hitting `/messages/channel/:channelId` not `/channels/:channelId` (a path that doesn't exist on this backend).

---

### Channel history always empty

`fetchMessages` returns 200 with `[]`. The channel UUID being fetched doesn't match any `channel_id` in the messages table. Always use the real UUIDs from the Known Test Data section — slug strings like `"general"` will never match.

---

### join_institute joins a room named `[object Object]`

Messages emit but `receive_message` never fires. `join_institute` was called with `{ channelId }` (an object) instead of `channelId` (the raw string). The backend does `socket.join(channel_id)` where the argument is used directly — passing an object makes it join a room literally named `[object Object]`.

Always emit: `socket.emit('join_institute', channelId)` — the raw UUID string. Same applies to `leave_institute`.

---

### linkToInstitute does nothing in the DB

The frontend sends the correct payload. The bug is in the backend controller: `db.linkToInstituteQuery(userId, institute_id)` is called with swapped arguments. The SQL is `UPDATE users SET institute_id = $1 WHERE id = $2`, which expects `(instituteId, userId)`.

Backend fix in `AuthController.js`:
```js
const link = await db.linkToInstituteQuery(institute_id, userId)
```

---

### UserProfilePopover not appearing

Verify `api.js` includes the `getUserProfile` function and that the backend has the GET `/auth/user-profile/:userId` endpoint. The endpoint must return `{ user: { id, username, email, role, created_at } }`. Also check that `UserProfilePopover.jsx` is imported and rendered conditionally in `MessageList.jsx`.

---

_Last updated: March 2026_