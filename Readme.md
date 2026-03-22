# 💬 Mizuka Connect — Real-Time Multi-Institute Chat Engine

> A modern, scalable chat platform designed for educational institutions and organizations. Built with React, Express, PostgreSQL, and Socket.io for seamless real-time communication across multiple institutes.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-connect--mizuka.vercel.app-00D9FF?style=flat&logo=vercel&logoColor=white)](https://connect-mizuka.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-zahooruddin--dev-181717?style=flat&logo=github&logoColor=white)](https://github.com/Zahooruddin-dev/Connect-Mizuka)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

[![Mizuka Connect Preview](https://raw.githubusercontent.com/Zahooruddin-dev/Connect-Mizuka/main/frontend/Docs/mizuka-connect.jpg)](https://connect-mizuka.vercel.app)

---

## 🌟 Features

### Core Chat Functionality
- ✅ **Real-Time Messaging** — Instant message delivery powered by Socket.io
- ✅ **Channel-Based Communication** — Organize conversations by institute and topic
- ✅ **Direct Messages (P2P)** — One-on-one private conversations with unread tracking
- ✅ **Typing Indicators** — See who's typing in real-time across channels and DMs
- ✅ **Message Search** — Full-text search across channels and direct message conversations
- ✅ **Message Management** — Edit and delete your own messages
- ✅ **Copy Messages** — Copy any message to clipboard with a toast confirmation

### Multi-Tenant Architecture
- ✅ **Multiple Institutes** — Users can belong to and switch between multiple organizations
- ✅ **Role-Based Access** — Admin and member roles with permission enforcement at API level
- ✅ **Member Discovery** — Search and connect with other institute members
- ✅ **Presence Tracking** — See who's online across your institutes in real time

### User Profiles & Profile Pictures
- ✅ **Profile Pictures** — Upload a photo via Cloudinary; displayed in sidebar, inbox, message avatars, DM header, and profile popover everywhere across the app
- ✅ **Live Profile Updates** — Profile picture and username updates reflect everywhere without re-logging in
- ✅ **Profile Popover** — Click any user's avatar or username to view their profile and start a DM
- ✅ **Editable Profile Panel** — Update username, email, password, and profile photo in-app
- ✅ **Auto-Hydration** — On login, fresh user data is always fetched from the backend to ensure profile pictures are up-to-date even across devices and cleared sessions

### Inbox & Direct Messages
- ✅ **Always-Present Recent Chats** — DM conversations are seeded from the backend on every login so they always appear regardless of device or cleared local storage
- ✅ **Unread Badges** — Per-conversation unread counts updated in real time, cleared when a chat is opened
- ✅ **Sidebar Auto-Switch** — Sidebar automatically switches to the Inbox tab whenever a DM is opened from anywhere in the app
- ✅ **Message Search in DMs** — Search across all direct message conversations
- ✅ **Profile Pictures in Inbox** — Contact avatars shown in recent chats and search results

### User Experience
- ✅ **Light Warm Theme** — Raycast-inspired off-white palette with teal accents; fully token-based via CSS variables
- ✅ **Mobile Responsive** — Sidebar slides in as a drawer; touch-friendly tap targets; iOS keyboard zoom prevented
- ✅ **Mobile Message Menu** — Three-dot context menu on mobile for Copy, Edit, Delete (replaces desktop hover actions)
- ✅ **Message Input Cancel** — Clear button and Escape key support on the message input
- ✅ **Auto-Resize Input** — Message textarea grows as you type up to a max height
- ✅ **Skeleton Loading** — Skeleton screens replace loading spinners for chat area and messages
- ✅ **Waking Banner** — Informational banner shown while the backend wakes up on first load (Koyeb free tier)
- ✅ **Secure Authentication** — JWT-based auth with email + password reset flow via 6-digit code
- ✅ **Session Persistence** — Stay logged in across page refreshes; all state hydrated from localStorage

---

## 🏗️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **Socket.io Client 4** | Real-time WebSocket client |
| **Axios** | HTTP client with JWT interceptor |
| **Tailwind CSS + CSS Variables** | Styling (Tailwind) |
| **Lucide React** | Icon library |
| **Sora + DM Mono** | Typography (Google Fonts) |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express v5** | REST API & HTTP server |
| **Socket.io v4** | Real-time bidirectional communication |
| **PostgreSQL** | Relational database |
| **JWT** | Stateless authentication |
| **Bcrypt** | Password hashing |
| **Multer + Cloudinary** | Profile picture uploads |
| **Zod** | Request body validation |
| **Nodemailer** | Password reset emails (Gmail) |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** (local, Neon, or any managed service)
- **Cloudinary** account (free tier is sufficient)
- **npm** or **yarn**
- **Gmail account** (for password reset emails)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/zahooruddin-dev/Mizuka-Connect.git
cd Mizuka-Connect
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:password@localhost:5432/mizuka

# Authentication
JWT_SECRET=your_super_secret_key_here_make_it_long

# Cloudinary (profile picture uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Run the database migration (required once if upgrading from an older version):

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL;
```

Start the backend:

```bash
npm run server    # development (nodemon)
npm start         # production
```

Backend runs on `http://localhost:3000`

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4️⃣ Access the App

Open [http://localhost:5173](http://localhost:5173) in your browser and register a new account.

---

## 📁 Project Structure

```
Mizuka-Connect/
├── 📖 README.md                       ← You are here
├── 📋 LICENSE
│
├── backend/                           ← Express + Socket.io API
│   ├── 📘 README.md                   ← Detailed backend documentation
│   ├── app.js                         ← Server entry point + Socket.io setup
│   ├── package.json
│   │
│   ├── Controller/                    ← Business logic
│   │   ├── AuthController.js          ← Login, register, profile update (incl. photo)
│   │   ├── channelController.js
│   │   ├── instituteController.js
│   │   ├── messageController.js
│   │   ├── p2pController.js           ← P2P rooms, messages, unread, chatroom list
│   │   └── ResetController.js
│   │
│   ├── Routes/
│   │   ├── authRoutes.js              ← Includes upload middleware on update-profile
│   │   ├── channelRoutes.js
│   │   ├── instituteRoutes.js
│   │   ├── messageRoutes.js
│   │   └── p2pRoutes.js               ← Includes GET /rooms for chatroom seeding
│   │
│   ├── db/
│   │   ├── Pool.js
│   │   ├── queryAuth.js               ← Includes profile_picture in all user queries
│   │   ├── queryChannel.js
│   │   ├── queryInstitute.js          ← Includes profile_picture in member queries
│   │   ├── queryP2P.js                ← Includes getUserChatrooms + profile_picture JOIN
│   │   ├── querySocketMessage.js
│   │   └── queryReset.js
│   │
│   ├── Socket-Controllers/
│   │   ├── messageController.js       ← Emits profile_picture in receive_message
│   │   └── P2psocketcontroller.js     ← Emits profile_picture in receive_p2p_message
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── uploadMiddleware.js        ← Multer memory storage + Cloudinary upload_stream
│   │   └── validateRequest.js
│   │
│   └── validation/
│       ├── authValidation.js
│       ├── channelValidation.js
│       └── instituteValidation.js
│
└── frontend/                          ← React + Vite SPA
    ├── 📘 README.md                   ← Detailed frontend documentation
    ├── index.html
    ├── vite.config.js
    ├── package.json
    │
    └── src/
        ├── main.jsx
        ├── App.jsx                    ← Layout shell, routing, active state management
        │
        ├── pages/
        │   └── LoginPage.jsx          ← Login, register, password reset
        │
        ├── components/
        │   ├── Sidebar.jsx            ← Channels + inbox tab + backend-seeded recent chats
        │   ├── Inbox.jsx              ← DM list + member search + message search
        │   ├── ChatArea.jsx           ← Channel + P2P chat logic, socket listeners
        │   ├── ChatHeader.jsx         ← Channel header + P2P header with avatar popover
        │   ├── MessageList.jsx        ← Scrollable messages + typing indicator
        │   ├── MessageItem.jsx        ← Message bubble, avatar, copy/edit/delete, mobile menu
        │   ├── MessageInput.jsx       ← Textarea, send, cancel, auto-resize
        │   ├── ChatSkelton.jsx        ← Loading skeleton
        │   ├── UserProfilePanel.jsx   ← Own profile: edit username + upload photo
        │   ├── UserProfilePopover.jsx ← Other user's profile + Direct Message button
        │   ├── InstituteSidebar.jsx   ← Institute management panel
        │   ├── InstituteGate.jsx      ← Create / join institute gate
        │   ├── CreateChannelModal.jsx
        │   ├── ChangePasswordModal.jsx
        │   ├── Avatar.jsx             ← Reusable avatar (image or initials fallback)
        │   └── Toast.jsx              ← Toast notifications (e.g. copy confirmation)
        │
        ├── services/
        │   ├── AuthContext.jsx        ← Auth state, updateUser, on-mount user refresh
        │   ├── api.js                 ← Axios instance, all REST calls
        │   ├── p2p-api.js             ← P2P-specific calls
        │   └── socket.js              ← Socket.io singleton
        │
        ├── utils/
        │   ├── time.js
        │   └── dateFormat.js
        │
        └── styles/
            ├── globals.css            ← All CSS variables, reset, scrollbar
            ├── app.css
            └── Toast.css              ← Toast + waking banner styles
```

---

## 🔐 Authentication & Security

### Login & Registration

1. **Register** — Provide username, email, password, and role (`member` or `admin`)
2. **Login** — Receive a JWT valid for 24 hours plus a full user object including `profile_picture`
3. **Join Institute** — Use an institute UUID to become a member
4. **Switch Institutes** — Toggle between multiple institutes from the sidebar

### Admin Features

Only users with `role = 'admin'` can:
- Create, rename, and delete channels
- Delete any message in their institute channels
- View the institute dashboard

All admin checks are enforced at the API level — the frontend hides UI only as a convenience.

---

## 🖼️ Profile Pictures

Profile pictures are uploaded via the user profile panel (`Camera` icon over the avatar):

1. User selects an image file (JPG, PNG, WebP, AVIF)
2. Multer holds the file in memory
3. The file is piped to Cloudinary via `upload_stream`
4. The returned `secure_url` is saved to `users.profile_picture` in PostgreSQL
5. `AuthContext.updateUser({ profile_picture })` updates the React state and localStorage immediately

Profile pictures are displayed in:
- **Sidebar footer** — own avatar
- **Inbox** — recent chats list and member search results
- **Message avatars** — own messages (from context) and others' messages (from DB join)
- **Chat header** — DM header avatar (clickable — opens profile popover)
- **Profile popover** — other user's full profile card

---

## 📡 Real-Time Features

### Socket.io Events

**Channel events:** `join_institute`, `leave_institute`, `send_message` → `receive_message`, `Display_typing`, `hide_typing`, `channel_created`, `channel_renamed`, `channel_deleted`

**P2P events:** `join_p2p`, `leave_p2p`, `send_p2p_message` → `receive_p2p_message`, `Display_p2p_typing`, `hide_p2p_typing`, `delete_p2p_message` → `p2p_message_deleted`, `edit_p2p_message` → `p2p_message_edited`

**Presence events:** `user_online`, `join_user_room` → `update_user_status`, `online_users_list`

Both `receive_message` and `receive_p2p_message` now include `profile_picture` in the payload so avatars update live for incoming messages.

See `backend/README.md` for the full socket event contract.

---

## 🗄️ Database

### Schema Overview

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    profile_picture TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    PRIMARY KEY (user_id, institute_id)
);

CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT FALSE
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE p2p_chatrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_two_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE p2p_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatroom_id UUID REFERENCES p2p_chatrooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_resets (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```

### Migration (existing databases)

```sql
-- Required if upgrading from a version before profile pictures were added
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL;

-- Required for unread tracking if not already present
ALTER TABLE p2p_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_p2p_messages_unread
  ON p2p_messages (chatroom_id, sender_id, is_read)
  WHERE is_read = FALSE;
```

### Using Neon (Recommended for Cloud Development)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a PostgreSQL project and copy the connection string
3. Set `DATABASE_URL` in your `.env`
4. Run the schema SQL manually in the Neon SQL editor

---

## 🧪 Testing the API

Use any REST client (VS Code REST Client, Postman, Insomnia):

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Full API reference in `backend/README.md`.

---

## 📚 Detailed Documentation

| Location | File | Contents |
|---|---|---|
| `backend/` | `README.md` | Full API endpoint reference, socket event contract, DB schema |
| `frontend/` | `README.md` | Component map, state management, CSS design tokens, mobile behaviour |

---

## 🌐 Live Demo

**[connect-mizuka.vercel.app](https://connect-mizuka.vercel.app)**

> The backend runs on Koyeb free tier. First load after inactivity may take ~30 seconds — the app displays a waking banner while it spins up.

---

## 🐛 Troubleshooting

**Port already in use**
```bash
PORT=4000  # change in .env
```

**Profile picture not uploading**
- Confirm `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are all set in `.env`
- The `uploadMiddleware.js` uses `multer.memoryStorage()` + `cloudinary.uploader.upload_stream` — no adapter package is needed

**Profile picture not appearing for existing sessions**
- `AuthContext` fetches `/auth/user-info` on mount to hydrate `profile_picture` for users who logged in before pictures were added — if this isn't working, check the `/auth/user-info` endpoint returns `profile_picture`

**Socket.io not connecting**
- Ensure the backend is running on port 3000
- Verify the Vite proxy in `vite.config.js` forwards `/socket.io` to `http://localhost:3000`
- The socket client must connect to `http://localhost:5173` (Vite), not directly to port 3000 — cross-origin polling will fail

**Messages not saving to DB**
- The socket payload for channel messages must use `message` (not `content`) and `sender_id` (not `userId`) — these are the exact field names the backend destructures
- For P2P: `chatroom_id`, `message`, `sender_id`, `username`

**Recent DM chats not showing on new device**
- `GET /p2p/rooms` is fetched on mount to seed recent chats from the backend — verify this route is registered in `p2pRoutes.js` and `getUserChatrooms` is exported from `p2pController.js`

**Email not sending**
- Use a Gmail **App Password**, not your regular Gmail password
- Check `EMAIL_USER` and `EMAIL_PASS` in `.env`

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m 'feat: add your feature'`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Match the existing code style — no Tailwind, no CSS-in-JS, no external state libraries
- All design values must use CSS variables from `globals.css`
- Test on both desktop and mobile before submitting
- Update the relevant `README.md` when changing API or socket contracts

---

## 🎯 Roadmap

### Planned Features
- [ ] File and image sharing in messages
- [ ] Message reactions
- [ ] Threaded replies
- [ ] Channel pinned messages
- [ ] Voice and video calling
- [ ] Admin analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Message encryption
- [ ] Institute member invitations via email

### Recently Completed
- ✅ Profile pictures (upload, display everywhere, live updates)
- ✅ Backend-seeded DM recent chats (always visible on any device)
- ✅ Mobile three-dot context menu for messages
- ✅ Copy message with toast confirmation
- ✅ Message input cancel button + auto-resize textarea
- ✅ Sidebar auto-switches to Inbox when DM opens
- ✅ User profile popover from chat header avatar (P2P)
- ✅ Zod validation on all POST/PUT routes
- ✅ Cloudinary profile picture upload via memory storage

---

## 📊 Project Status

| Component | Status |
|---|---|
| Core Chat (Channels) | ✅ Production Ready |
| Direct Messages (P2P) | ✅ Production Ready |
| Real-Time Messaging | ✅ Stable |
| Profile Pictures | ✅ Complete |
| Authentication | ✅ Secure |
| Database | ✅ Optimized |
| Frontend | ✅ Responsive |
| REST API | ✅ Complete |
| Mobile Experience | ✅ Optimized |

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 👤 Developer

**Zahooruddin (MZ)**
- 📧 [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)
- 🐙 [@zahooruddin-dev](https://github.com/zahooruddin-dev)

---

## 📬 Support

- **GitHub Issues:** [Create an issue](https://github.com/zahooruddin-dev/Mizuka/issues)
- **Email:** [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)

---

_Last updated: March 2026_