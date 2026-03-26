# 🎨 Mizuka Connect — Frontend SPA

A modern, responsive React chat application built with **Vite**, **Tailwind CSS**, and **Socket.io**. Supports real-time messaging, audio messages, voice/video calling, multi-institute support, and full dark mode.

Live demo: [connect-mizuka.vercel.app](https://connect-mizuka.vercel.app)  
GitHub: [Zahooruddin-dev/Connect-Mizuka](https://github.com/zahooruddin-dev/Connect-Mizuka)

---

## 🔧 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Modern browser** with WebRTC support (Chrome, Firefox, Safari, Edge)
- **Backend API** running on `http://localhost:3000` (or configured VITE_API_URL)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd Mizuka-Connect/frontend
npm install
```

### 2. Configure Environment

Create `.env.local` in the frontend root:

```env
# Backend API (dev proxy configured in vite.config.js)
VITE_API_URL=http://localhost:3000

# Optional: Override Socket.io server
VITE_SOCKET_URL=http://localhost:3000
```

With the Vite proxy config, you can omit `VITE_API_URL` — it defaults to `/api` → `http://localhost:3000/api`.

### 3. Start Development Server

```bash
npm run dev
```

App runs on `http://localhost:5173` with hot module reloading.

### 4. Build for Production

```bash
npm run build
# Output: dist/
npm run preview  # Preview production build locally
```

---

## 📁 Project Structure

```
frontend/
├── index.html                           ← HTML entry point
├── package.json
├── vite.config.js                       ← Vite + Tailwind + API proxy
├── tailwind.config.js                   ← Tailwind token mappings
│
├── src/
│   ├── main.jsx                         ← React bootstrap with AuthProvider
│   ├── App.jsx                          ← Layout shell + routing logic
│   │
│   ├── pages/
│   │   └── LoginPage.jsx                ← Auth form (login/register/reset)
│   │
│   ├── components/
│   │   ├── Avatar.jsx                   ← Avatar component (image or initials)
│   │   ├── ChatArea.jsx                 ← Main chat container (channel or P2P)
│   │   ├── ChatHeader.jsx               ← Header with name/controls/calls
│   │   ├── ChatSkeleton.jsx             ← Loading placeholder
│   │   ├── ChatWindow.jsx               ← Chat message view
│   │   ├── MessageBubble.jsx            ← Individual message bubble
│   │   ├── MessageInput.jsx             ← Text input + voice record
│   │   ├── MessageItem.jsx              ← Message + context menu
│   │   ├── MessageList.jsx              ← Scrollable messages
│   │   ├── AudioPlayer.jsx              ← Audio playback (seek, speed, mute)
│   │   ├── AudioRecorder.jsx            ← Advanced audio record UI
│   │   ├── VoiceRecorder.jsx            ← Quick voice message button
│   │   ├── CallModal.jsx                ← Active call interface
│   │   ├── IncomingCallModal.jsx        ← Incoming call popup
│   │   ├── TypingIndicator.jsx          ← Animated typing dots
│   │   ├── DateDivider.jsx              ← Date separator
│   │   ├── Toast.jsx                    ← Toast notifications
│   │   ├── Sidebar.jsx                  ← Navigation + channels + DMs
│   │   ├── Inbox.jsx                    ← P2P chatroom list
│   │   ├── UserProfilePanel.jsx         ← Own profile editor
│   │   ├── UserProfilePopover.jsx       ← Other user profile popup
│   │   ├── InstituteSidebar.jsx         ← Admin panel
│   │   ├── InstituteGate.jsx            ← Create/join institute
│   │   ├── CreateChannelModal.jsx       ← Channel form
│   │   ├── ChangePasswordModal.jsx      ← Password change form
│   │   └── WakingBanner.jsx             ← Backend startup notice
│   │
│   ├── hooks/
│   │   ├── useCallManager.js            ← WebRTC call state & media
│   │   └── useTheme.js                  ← Dark/light theme toggle
│   │
│   ├── services/
│   │   ├── AuthContext.jsx              ← Global auth state (user, institutes)
│   │   ├── api.js                       ← Axios HTTP client with JWT
│   │   ├── socket.js                    ← Socket.io singleton
│   │   └── p2p-api.js                   ← P2P-specific API calls
│   │
│   ├── utils/
│   │   ├── dateFormat.js                ← Time/date formatting
│   │   └── time.js                      ← Time utilities
│   │
│   └── styles/
│       ├── global.css                   ← Tailwind @theme, base styles
│       ├── app.css                      ← Layout + component styles
│       └── LoginPage.css                ← Login page animations
│
└── public/
    └── vite.svg
```

---

## ⚙️ Configuration Files

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true  // Enable WebSocket proxying
      }
    }
  }
})
```

**Key features**:
- Vite for fast HMR (hot module reload)
- Tailwind CSS plugin for JIT compilation
- React Fast Refresh for instant updates
- API proxy to backend (no CORS issues in dev)
- WebSocket proxying for Socket.io

### tailwind.config.js

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Map design tokens to Tailwind utilities
        'teal': {
          '50': 'var(--teal-50)',
          '100': 'var(--teal-100)',
          // ... 300-900
        },
        'base': 'var(--bg-base)',
        'surface': 'var(--bg-surface)',
        'panel': 'var(--bg-panel)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
    },
  },
}
```

---

## 🎯 Component Architecture

### Core Components

#### **Avatar.jsx** — Reusable avatar component
```javascript
<Avatar 
  src={profilePicture}  // Image URL or null
  username="johndoe"    // Fallback to initials
  size={30}            // Width/height in pixels
  className="..."      // Additional Tailwind classes
/>
```

Renders image-based avatar or fallback to user initial with gradient background.

#### **ChatArea.jsx** — Main chat container
- Detects channel vs P2P mode
- Loads message history
- Manages Socket.io subscriptions
- Handles message send/delete
- Triggers call flows

Props: `channelId`, `instituteId`, `roomId`, `user`, `onStartP2P`, `isAdmin`

#### **ChatHeader.jsx** — Context-aware header
- **Channel mode**: Channel name (editable by admin), delete button, member count
- **P2P mode**: User avatar, profile button, call buttons (audio/video)
- Lives updates via Socket.io for name changes

#### **MessageList.jsx** — Scrollable message feed
- Infinite scroll pagination (lazy load older messages)
- Date dividers between message groups
- Typing indicators at bottom
- Auto-scroll on new messages
- Skeleton loading state

#### **MessageItem.jsx** — Individual message wrapper
- Text or audio message rendering
- Sender avatar + name
- Timestamp
- Desktop hover actions (copy/edit/delete)
- Mobile context menu (3-dot menu)
- Message deletion confirmation

#### **MessageBubble.jsx** — Message content renderer
- Text content with word wrapping
- Audio player for audio messages
- Styling based on sender (mine vs theirs)
- Copy to clipboard support

#### **MessageInput.jsx** — Advanced input component
- Auto-resizing textarea (grows with content)
- Send button with validation
- Clear button with Escape key support
- Voice recording button
- Keyboard shortcuts:
  - **Enter** → Send
  - **Shift+Enter** → New line
  - **Escape** → Clear

#### **AudioRecorder.jsx** — Comprehensive audio recording
States: `requesting` → `recording` → `preview` → `uploading`

Features:
- Mic permission request with friendly errors
- Live duration timer
- Audio preview player
- Send/discard buttons
- Upload progress feedback
- Error handling and retry

#### **AudioPlayer.jsx** — Full-featured audio playback
```javascript
<AudioPlayer 
  src="https://cloudinary.url/voice.webm"
  isMine={true}  // Styling context
/>
```

Features:
- Play/pause toggle
- Seekable progress bar with touch support
- Current time / total duration display
- Mute/unmute button
- Playback speed control: 0.5x, 1x, 1.5x, 2x
- Responsive on mobile

#### **VoiceRecorder.jsx** — Quick voice message button
- Single-button interface in MessageInput
- Three states: idle → recording → recorded
- Minimal UI footprint
- Auto-cleanup on cancel

#### **CallModal.jsx** — Active call interface
- Local video in corner (video calls)
- Remote video full-screen
- Call duration timer
- Mute/unmute button
- Camera toggle (video only)
- End call button
- Works for both audio and video

#### **IncomingCallModal.jsx** — Incoming call notification
- Caller avatar and name
- Call type indicator (audio vs video)
- Accept/decline buttons
- Auto-decline timer (15 seconds)
- Slides in from bottom-right
- Doesn't block chat content

#### **Sidebar.jsx** — Navigation hub
- Institute switcher
- Channel list with active highlighting
- Inbox tab (P2P chatrooms)
- Member search
- User profile menu
- Responsive drawer (mobile)

#### **Inbox.jsx** — P2P chatroom list
- Recent chats seeded from backend
- Unread badge counts
- Last message preview
- Click to open DM
- Full-text message search
- Member discovery search

#### **UserProfilePanel.jsx** — Own profile editor
- Avatar with upload button
- Username editor (inline edit)
- Email display
- Password change modal
- Profile picture stored in Cloudinary
- Live updates across app

#### **UserProfilePopover.jsx** — Other user profile popup
- Avatar + username + email
- Direct message button
- Click-outside dismiss
- Non-intrusive overlay

#### **InstituteSidebar.jsx** — Admin panel
- Create channel form
- Member list
- Institute key (for invites)
- Admin-only visibility

#### **InstituteGate.jsx** — Create/join institutes
- Create new institute form
- Join institute form (via UUID)
- List existing institutes
- Navigate to first channel after selection

#### **CreateChannelModal.jsx** — Channel creation form
- Channel name input (validation: lowercase, hyphens, underscores, 2-64 chars)
- Private/public toggle
- Form submission + error handling
- Modal backdrop with click-outside dismiss

#### **ChangePasswordModal.jsx** — Password change form
- Current password verification
- New password input
- Confirmation input
- Form validation
- Loading state during submit

#### **ChatSkeleton.jsx** — Loading placeholder
- Header skeleton
- Message line skeletons with varied widths
- Input area skeleton
- Shimmer animation
- Matches actual layout dimensions

#### **TypingIndicator.jsx** — Typing animation
```javascript
<TypingIndicator username="johndoe" />
```

Shows animated three-dot indicator with username, clears when typing stops.

#### **DateDivider.jsx** — Date separator
```javascript
<DateDivider label="Today" />
```

Centered date display between message groups for temporal context.

#### **Toast.jsx** — Toast notifications
```javascript
<Toast 
  message="Message copied!"
  visible={true}
  type="success"  // success, error, info, warning
/>
```

Auto-dismisses after 3.5 seconds. Stacks multiple toasts.

---

## 🪝 Hooks

### useCallManager.js

---

## ✅ Additional Notes

- **Environment:** Keep `.env.local` out of source control and use CI/CD secrets for production values.
- **API URL:** If deploying frontend separately, set `VITE_API_URL` to your backend origin and `VITE_SOCKET_URL` for Socket.io.

## 🧪 Testing

- Use `npm run dev` for local development with HMR and manual testing via browser.
- Run UI smoke checks by interacting with flows: login, create channel, send message, record audio, and initiate a call.
- Use the `test.rest` file from the backend folder or Postman to verify API endpoints while testing the UI.

## 📦 Deployment

1. Build the production bundle:

```bash
npm run build
```

2. Serve the `dist/` output with a static host (Vercel, Netlify, Surge, or any CDN-backed host).
3. Ensure `VITE_API_URL` in production points to the live backend and that CORS allows the frontend origin.
4. If using a separate socket server, enable `VITE_SOCKET_URL` and confirm WebSocket support.

## 🔐 Security & Production Recommendations

- Use HTTPS in production for both frontend and backend to secure WebRTC, cookies, and API traffic.
- Use secure, same-site cookies or token storage best practices for JWTs.
- Limit file sizes for uploads client-side and validate types before sending to the server.

## 🛠 Troubleshooting

- If HMR fails, delete `node_modules/.vite` and restart `npm run dev`.
- If audio recording doesn't work, verify browser microphone permissions and HTTPS context (required on some browsers).
- If Socket.io fails to connect, check `VITE_SOCKET_URL`, proxy settings in `vite.config.js`, and backend socket server logs.

## 🤝 Contributing

- Send focused PRs with clear descriptions and include screenshots or short recordings for UI changes.
- Add unit tests for critical utilities and front-end integration tests for core flows.

## 📬 Contact

- Maintainer: Zahooruddin — see the repository for contact details and issue tracker.
- Repo: https://github.com/zahooruddin-dev/Connect-Mizuka

Manages complex WebRTC call state and media stream handling:

```javascript
const {
  callState,      // { phase, callType, localStream, remoteStream, duration, ... }
  startCall,      // ({ targetUserId, targetUsername, callType }) => void
  acceptCall,     // () => void
  rejectCall,     // () => void
  endCall,        // () => void
  toggleMute,     // () => void
  toggleCamera,   // () => void
} = useCallManager({ user, onToast });
```

**State phases**: `null`, `incoming`, `outgoing`, `active`

**Call types**: `audio`, `video`

**Features**:
- RTCPeerConnection creation and configuration
- Media stream acquisition with echo cancellation
- Offer/answer/ICE candidate exchange via Socket.io
- Mute/camera toggle
- Duration timer
- Auto-cleanup on disconnect
- Error handling for permission denials

### useTheme.js

Dark/light theme toggle with localStorage persistence:

```javascript
const { theme, toggle } = useTheme();
// theme: 'light' | 'dark'
// toggle: () => void
```

Updates `document.documentElement.data-theme` attribute and persists to localStorage.

---

## 📡 Services

### AuthContext.jsx

Global authentication state management:

```javascript
const {
  user,                    // { id, username, email, profile_picture, institutes }
  institutes,              // Array of institute objects
  activeInstitute,         // Currently selected institute
  logout,                  // () => void
  isActiveAdmin,           // () => boolean
  updateUser,              // (updates) => void
} = useAuth();
```

Features:
- JWT token storage in localStorage
- Auto-refresh on mount
- User profile update callback
- Institute switching
- Admin role detection

### api.js

Axios HTTP client with JWT interceptor:

```javascript
import api from '../services/api';

// All endpoints include Bearer token automatically
const response = await api.get('/auth/user-info');
const response = await api.post('/channel/create', { name, institute_id });
```

**Configured endpoints**:
- Auth: register, login, password reset, profile update
- Channels: create, update, delete, fetch, search
- Institutes: create, dashboard, members, search
- Messages: fetch, delete, upload audio
- P2P: rooms, messages, unread counts, search

### socket.js

Socket.io singleton connection:

```javascript
import socket from '../services/socket';

socket.emit('send_message', { channel_id, message, ... });
socket.on('receive_message', (data) => { ... });
socket.on('typing', (data) => { ... });
```

**Auto-reconnect** on disconnect with exponential backoff.

---

## 🎨 Styling & Theme System

### global.css

```css
@import 'tailwindcss';

/* Design tokens (colors, spacing, radius) */
:root {
  --teal-50: #f0fdfa;
  --teal-100: #ccfbf1;
  /* ... --teal-900 */
  
  --bg-base: #dedad4;
  --bg-surface: #e4e0da;
  --bg-panel: #ede9e3;
  --bg-hover: #d4cfc8;
  --bg-input: #d8d3cc;
  
  --text-primary: #1a1a1a;
  --text-secondary: #363636;
  --text-muted: #5e5e5e;
  --text-ghost: #8f8f8f;
  
  --border: rgba(0, 0, 0, 0.1);
  --border-strong: rgba(0, 0, 0, 0.18);
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 22px;
}

/* Dark mode */
[data-theme="dark"] {
  --bg-base: #1a1917;
  --bg-surface: #211f1c;
  --bg-panel: #2a2724;
  --text-primary: #f0ece6;
  --text-secondary: #c9c3bb;
  /* ... more overrides */
}

/* Animations */
@keyframes card-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce-dot {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
  40% { transform: translateY(-4px); opacity: 0.8; }
}
```

### Design Token System

All colors, spacing, and radius use CSS custom properties:

```jsx
// Example: Primary button
className="bg-[var(--teal-600)] hover:bg-[var(--teal-700)] text-white"

// Example: Card surface
className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)]"

// Example: Text hierarchy
className="text-[var(--text-primary)]"  // Primary
className="text-[var(--text-muted)]"    // Secondary
className="text-[var(--text-ghost)]"    // Tertiary
```

**Benefits**:
- Single source of truth (one CSS file)
- Easy dark mode toggle (swap all variables at once)
- Consistency across components
- Maintainable without custom CSS
- Full Tailwind support

### Tailwind Utilities

Used exclusively with custom properties:

```jsx
// Flexbox
className="flex items-center justify-between gap-3"

// Responsive
className="hidden md:flex"
className="w-full md:w-96"

// States
className="hover:bg-[var(--bg-hover)] transition-[background] duration-150"
className="disabled:opacity-50 disabled:cursor-not-allowed"

// Animations
className="animate-[card-enter_0.3s_ease]"
className="animate-[bounce-dot_1.2s_ease-in-out_infinite]"
```

---

## 🔌 Socket.io Event Reference

### User Presence

```javascript
// Register user as online
socket.emit('user_online', userId);

// Receive online user updates
socket.on('update_user_status', ({ userId, status }) => {
  // status: 'online' | 'offline'
});
```

### Channel Messages

```javascript
// Send message
socket.emit('send_message', {
  channel_id: 'uuid',
  sender_id: 'uuid',
  message: 'Hello!',
  type: 'text'  // or 'audio'
});

// Receive message
socket.on('receive_message', (data) => {
  // data: { id, content, sender_id, username, type, profile_picture, created_at }
});

// Typing indicator
socket.emit('typing', { channel_id: 'uuid', username: 'johndoe' });
socket.on('Display_typing', (data) => { ... });

socket.emit('stop_typing', { channel_id: 'uuid' });
socket.on('hide_typing', (data) => { ... });
```

### P2P Messages

```javascript
// Send P2P message
socket.emit('send_p2p_message', {
  chatroom_id: 'uuid',
  message: 'Hey!',
  sender_id: 'uuid',
  type: 'text'
});

// Receive P2P message
socket.on('receive_p2p_message', (data) => {
  // data: { id, chatroom_id, content, sender_id, username, type, is_read }
});

// Mark room as read
socket.emit('mark_as_read', { chatroom_id: 'uuid', reader_id: 'uuid' });
```

### WebRTC Calling

```javascript
// Initiate call
socket.emit('call:user', {
  toUserId: 'uuid',
  callerId: 'uuid',
  callerUsername: 'johndoe',
  callType: 'audio' | 'video',
  offer: { type: 'offer', sdp: '...' }
});

// Receive call
socket.on('call:incoming', ({
  from, fromUserId, callerUsername, callType, offer
}) => { ... });

// Answer call
socket.emit('call:accepted', {
  to: 'socketId',
  answer: { type: 'answer', sdp: '...' },
  callType: 'audio' | 'video'
});

// Exchange ICE candidates
socket.emit('ice-candidate', { to: 'socketId', candidate: {...} });
socket.on('ice-candidate', ({ candidate }) => { ... });

// End call
socket.emit('call:end', { to: 'socketId' });
socket.on('call:ended', () => { ... });
```

---

## 📝 Key Features

### Authentication
- Email/password registration
- Email/password login
- Password reset with 6-digit code
- Profile picture upload (Cloudinary)
- Session persistence via JWT in localStorage

### Real-Time Messaging
- Channel messages with text and audio support
- P2P (direct message) chat
- Message timestamps
- Message deletion and editing (P2P)
- Message copy to clipboard
- Full-text search across messages

### Audio & Calls
- Record audio messages inline
- Upload to Cloudinary
- Play audio with seek, speed, mute controls
- Voice/video calling with WebRTC
- Mute/camera toggles
- Call duration timer

### User Experience
- Light/dark theme with persistence
- Fully responsive (mobile drawer nav)
- Skeleton loading states
- Toast notifications
- Typing indicators
- Date dividers in conversations
- Unread message badges
- Message jump-to-search functionality

### Multi-Institute Support
- Switch between institutes
- Admin panel for channel management
- Create/delete channels
- Rename channels
- Search institute members
- Member list with roles

---

## 🧪 Development Workflow

### Hot Module Reload
Vite provides instant HMR for React components, styles, and hooks without full page reload:

```bash
npm run dev
# Save a file → Browser updates in milliseconds
```

### Testing Components

Use the `test.rest` file in backend for API testing, or test frontend manually:

1. Open DevTools Console
2. Check for errors
3. Test Socket.io events: `socket.emit('...')`
4. Inspect Redux store (if added)

### Building for Production

```bash
npm run build
# Outputs optimized build to dist/

npm run preview
# Preview production build locally on http://localhost:5173
```

---

## 🔐 Security Considerations

### JWT Storage
JWT token stored in `localStorage` — vulnerable to XSS. Consider:
- Using httpOnly cookies instead (requires backend changes)
- Sanitizing user inputs
- Using Content Security Policy (CSP) headers

### Audio/Image Upload
- Files uploaded to Cloudinary (third-party service)
- Client-side file validation (MIME type, size)
- Server-side validation and storage
- Secure URLs with access tokens

### WebRTC Privacy
- Peer-to-peer media streams encrypted by default
- ICE candidates handled securely
- No direct IP exposure in app (STUN servers used)

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Connect GitHub repo to Vercel
# Env vars in Vercel dashboard:
VITE_API_URL=https://your-backend.com
```

Vercel auto-deploys on git push with optimized builds.

### Netlify

```bash
npm run build
# Drop dist/ folder into Netlify dashboard
# Or connect GitHub for auto-deploy
```

Add `_redirects` file for SPA routing:
```
/*    /index.html   200
```

### Traditional Hosting

```bash
npm run build
# Upload dist/ to web server (Apache, Nginx, etc.)
```

Configure server to serve `index.html` for all routes (SPA routing).

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## 🐛 Troubleshooting

### API Calls Return 403

**Check**:
1. JWT token in localStorage: `localStorage.getItem('mizuka_token')`
2. Backend running: `http://localhost:3000/ping`
3. Correct Authorization header (should be automatic via api.js)
4. Token not expired (24-hour expiry)

### Socket.io Not Connected

**Check**:
1. Backend running and Socket.io enabled
2. Vite proxy for `/socket.io` working (check DevTools Network tab)
3. No CORS errors (check browser console)
4. Frontend and backend same protocol (both http or https)

### Audio Upload Fails

**Check**:
1. Browser allows mic access (check console for permission errors)
2. Backend Cloudinary credentials valid
3. Network allows file uploads
4. File format supported: webm, mp3, wav, ogg, m4a
5. File size under 25MB

### Messages Not Sending

**Check**:
1. Socket.io connected (check DevTools Console)
2. User authenticated (JWT token present)
3. Channel/room ID valid
4. Backend message handler exists
5. Database write succeeds (check backend logs)

### Dark Mode Not Applying

**Check**:
1. `useTheme()` hook called in component
2. CSS has `[data-theme="dark"]` selector defined
3. localStorage has `mizuka_theme` set
4. Browser allows localStorage

---

## 📚 Learning Resources

### React Patterns Used

- **Hooks**: useState, useEffect, useRef, useCallback, useContext
- **Context API**: AuthContext for global state
- **Socket.io**: Real-time event handling
- **Vite**: Fast dev server and optimized builds
- **Tailwind CSS**: Utility-first styling with custom tokens

### Key Files to Understand

1. **App.jsx** — Layout and routing logic
2. **AuthContext.jsx** — Global state management
3. **api.js** — HTTP client configuration
4. **socket.js** — Socket.io setup
5. **global.css** — Design system tokens

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Keep component files focused (one component per file)
4. Use Tailwind utilities — no custom CSS
5. Test on desktop (Chrome/Firefox) and mobile (Safari/Chrome)
6. Commit with clear messages: `git commit -m 'feat: add audio recording'`
7. Push and open Pull Request

### Code Style

- Use 2-space indentation
- Follow existing naming conventions (`camelCase`)
- Add comments for complex logic
- Use descriptive variable names
- Keep components under 300 lines
- Extract reusable logic into custom hooks

---

## 📄 License

MIT License — see LICENSE for details.

---

## 👤 Developer

**Zahooruddin (MZ)**
- 📧 Email: [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)
- 🐙 GitHub: [@zahooruddin-dev](https://github.com/zahooruddin-dev)
- 🌐 Portfolio: [zahooruddin.dev](https://zahooruddin.dev)

---

_Last updated: March 2026 — Comprehensive frontend documentation with Vite, Tailwind CSS, WebRTC calling, audio messages, and production-ready React patterns_