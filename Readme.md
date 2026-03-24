# 💬 Mizuka Connect — Real-Time Multi-Institute Chat Engine

> A modern, scalable chat platform designed for educational institutions and organizations. Built with React, Express, PostgreSQL, and Socket.io for seamless real-time communication across multiple institutes. Now featuring audio message support, comprehensive request validation, and advanced cloud storage integration.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-connect--mizuka.vercel.app-00D9FF?style=flat&logo=vercel&logoColor=white)](https://connect-mizuka.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-zahooruddin--dev-181717?style=flat&logo=github&logoColor=white)](https://github.com/Zahooruddin-dev/Connect-Mizuka)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

[![Mizuka Connect Preview](https://raw.githubusercontent.com/Zahooruddin-dev/Connect-Mizuka/main/frontend/Docs/mizuka-connect.jpg)](https://connect-mizuka.vercel.app)

---

## 🌟 Features

### Core Chat Functionality
- ✅ **Real-Time Messaging** — Instant message delivery powered by Socket.io with unified event handler architecture
- ✅ **Audio Message Support** — Record, upload, and share audio messages with automatic Cloudinary storage and streaming
- ✅ **Channel-Based Communication** — Organize conversations by institute and topic with flexible naming and privacy controls
- ✅ **Direct Messages (P2P)** — One-on-one private conversations with comprehensive unread tracking and read receipts
- ✅ **Typing Indicators** — See who's typing in real-time across both channels and direct messages
- ✅ **Message Search** — Full-text search across channels, direct messages, and audio content
- ✅ **Message Management** — Edit, delete, and recover your own messages with proper state synchronization
- ✅ **Copy Messages** — Copy any message to clipboard with visual confirmation via toast notifications

### Multi-Tenant Architecture
- ✅ **Multiple Institutes** — Users can belong to and switch between multiple organizations without re-authentication
- ✅ **Role-Based Access Control** — Comprehensive admin, teacher, and member role system with API-level permission enforcement
- ✅ **Member Discovery** — Search and connect with other institute members using full-text search
- ✅ **Presence Tracking** — Real-time online status visibility across your institutes with instant updates
- ✅ **Institute Management** — Admin dashboard for managing channels, members, and global institute keys

### User Profiles & Profile Pictures
- ✅ **Profile Pictures** — Upload photos via Cloudinary; displayed consistently across sidebar, inbox, message avatars, DM headers, and profile popovers
- ✅ **Live Profile Updates** — Profile picture and username updates reflect everywhere in real-time without requiring re-login or page refresh
- ✅ **Profile Popover** — Click any user's avatar or username to view their profile and initiate direct messages
- ✅ **Editable Profile Panel** — Update username, email, password, and profile photo within the application
- ✅ **Auto-Hydration** — On login, fresh user data is automatically fetched from the backend to ensure profile pictures are current across devices and cleared sessions
- ✅ **Profile Picture in Notifications** — Profile images appear in socket event payloads for live message avatars

### Inbox & Direct Messages
- ✅ **Always-Present Recent Chats** — DM conversations are seeded from the backend on every login, persisting across devices and local storage clears
- ✅ **Unread Badges** — Per-conversation unread counts updated in real-time with badge UI, cleared when a chat is opened
- ✅ **Read Receipts** — Track message read status with dedicated `is_read` column and optimized database queries
- ✅ **Sidebar Auto-Switch** — Sidebar automatically switches to the Inbox tab when a DM is opened from any location in the app
- ✅ **Message Search in DMs** — Full-text search across all direct message conversations with result highlighting
- ✅ **Profile Pictures in Inbox** — Contact avatars displayed in recent chats list and member search results

### Advanced Message Features
- ✅ **Audio Message Recording** — Record audio directly in chat using browser Web Audio API and stream to Cloudinary
- ✅ **Audio Playback** — Play audio messages inline with streaming from secure Cloudinary URLs
- ✅ **Message Type System** — Support for multiple message types (text, audio, future support for files) with proper database tracking
- ✅ **Audio Upload Middleware** — Dedicated multer/Cloudinary pipeline for audio file handling with automatic cleanup on deletion
- ✅ **Cloud Storage** — All audio and profile pictures stored in Cloudinary with version control and automatic deletion on message removal

### User Experience
- ✅ **Tailwind CSS Theme** — Modern design system built with Tailwind utility classes for responsive and accessible styling
- ✅ **Mobile Responsive** — Fully responsive interface with sidebar drawer navigation, touch-friendly tap targets, and iOS keyboard optimization
- ✅ **Mobile Message Menu** — Context menu on mobile devices for Copy, Edit, and Delete actions (replaces desktop hover interactions)
- ✅ **Message Input Features** — Clear button, Escape key cancellation, and auto-resize textarea that grows with content
- ✅ **Skeleton Loading** — Professional skeleton screens replace spinners for chat area and message lists during data loading
- ✅ **Waking Banner** — Informational banner displayed while backend wakes up on first load (Koyeb free tier optimization)
- ✅ **Secure Authentication** — JWT-based authentication with email + password reset flow using 6-digit verification codes
- ✅ **Session Persistence** — Users remain logged in across page refreshes with complete state hydration from localStorage

---

## 🏗️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI framework with hooks and context API |
| **Vite 5** | Build tool & dev server for fast HMR |
| **Tailwind CSS** | Utility-first CSS framework for responsive design |
| **Socket.io Client 4** | Real-time WebSocket client with automatic reconnection |
| **Axios** | HTTP client with JWT interceptor middleware |
| **Lucide React** | Modern icon library with consistent design |
| **Google Fonts** | Typography (Sora + DM Mono) for professional appearance |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express v5** | REST API server with middleware pipeline |
| **Socket.io v4** | Real-time bidirectional communication with unified handlers |
| **PostgreSQL** | Relational database with optimized queries and indexes |
| **JWT** | Stateless authentication with 24-hour token expiration |
| **Bcrypt** | Password hashing with salt rounds for security |
| **Multer + Cloudinary** | File upload handling for profile pictures and audio messages |
| **Zod** | Request body validation with schema-based approach |
| **Nodemailer** | Email delivery for password reset notifications via Gmail |
| **Cloudinary SDK** | Cloud storage and CDN for audio/image assets |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (LTS recommended for stability)
- **PostgreSQL** 13+ (local, Neon, or any managed service)
- **Cloudinary** account (free tier provides sufficient storage and bandwidth)
- **npm** or **yarn** package manager
- **Gmail account** with App Password (for email notifications)

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

Create a `.env` file in the `backend/` directory with all required environment variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgres://user:password@localhost:5432/mizuka

# Authentication & Security
JWT_SECRET=your_super_secret_key_here_make_it_long_at_least_32_characters

# Cloudinary Configuration (for profile pictures and audio messages)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for CORS configuration)
FRONTEND_URL=http://localhost:5173
```

### Database Schema Setup

Create the PostgreSQL database and run the schema migrations. The following SQL creates the complete schema with all required tables, indexes, and constraints:

```sql
-- Institutes (The "Organizations")
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users with profile picture support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'teacher')),
    profile_picture TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels for organized communication
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channel messages with support for multiple message types
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Institute membership with role tracking
CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, institute_id)
);

-- P2P Chatrooms with user pairing constraints
CREATE TABLE p2p_chatrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_pair UNIQUE(user_one_id, user_two_id),
    CONSTRAINT separate_users CHECK (user_one_id <> user_two_id)
);

-- P2P Messages with read status and deletion tracking
CREATE TABLE p2p_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatroom_id UUID NOT NULL REFERENCES p2p_chatrooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens with expiration
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimal query performance
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_p2p_room_users ON p2p_chatrooms (user_one_id, user_two_id);
CREATE INDEX idx_p2p_messages_room ON p2p_messages (chatroom_id);
CREATE INDEX idx_p2p_messages_time ON p2p_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_p2p_messages_unread
  ON p2p_messages (chatroom_id, sender_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_p2p_msgs_chatroom_time 
ON p2p_messages (chatroom_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_p2p_msgs_unread_active
ON p2p_messages (sender_id) 
WHERE is_read = false AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_p2p_chatrooms_participants 
ON p2p_chatrooms (user_one_id, user_two_id);
CREATE INDEX IF NOT EXISTS idx_user_institutes_institute_id ON user_institutes(institute_id);
```

### Start the Backend

```bash
npm run server    # development mode with nodemon
npm start         # production mode
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

Start the development server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4️⃣ Access the Application

Open [http://localhost:5173](http://localhost:5173) in your browser and register a new account to get started.

---

## 📁 Project Structure

```
Mizuka-Connect/
├── 📖 README.md                               ← You are here
├── 📋 LICENSE
│
├── backend/                                   ← Express + Socket.io API Server
│   ├── 📘 README.md                           ← Detailed backend documentation
│   ├── app.js                                 ← Server entry point with CORS and Socket.io setup
│   ├── package.json
│   │
│   ├── Controller/                            ← Business logic layer
│   │   ├── AuthController.js                  ← Login, register, profile updates with photo upload
│   │   ├── channelController.js               ← Channel creation, update, deletion, search
│   │   ├── instituteController.js             ← Institute management and member discovery
│   │   ├── messageController.js               ← Channel message handling and audio upload
│   │   ├── p2pController.js                   ← P2P rooms, messages, unread counts, chatroom seeding
│   │   └── ResetController.js                 ← Password reset request and verification
│   │
│   ├── Routes/                                ← API endpoint definitions
│   │   ├── authRoutes.js                      ← Auth endpoints with upload middleware
│   │   ├── channelRoutes.js                   ← Channel management endpoints
│   │   ├── instituteRoutes.js                 ← Institute endpoints with search
│   │   ├── messageRoutes.js                   ← Message CRUD and audio upload endpoints
│   │   └── p2pRoutes.js                       ← P2P endpoints including room seeding
│   │
│   ├── handlers/                              ← Socket.io event handlers
│   │   └── unifiedHandler.js                  ← Unified socket handler managing all real-time events
│   │
│   ├── Socket-Controllers/                    ← Real-time event logic
│   │   ├── messageController.js               ← Channel message emission with profile pictures
│   │   └── P2psocketcontroller.js             ← P2P message emission with read status and profiles
│   │
│   ├── db/                                    ← Database query layer
│   │   ├── Pool.js                            ← PostgreSQL connection pool
│   │   ├── queryAuth.js                       ← Auth queries with profile picture support
│   │   ├── queryChannel.js                    ← Channel queries with search functionality
│   │   ├── queryInstitute.js                  ← Institute queries with member discovery
│   │   ├── queryMessage.js                    ← Message queries with type support
│   │   ├── queryP2P.js                        ← P2P queries with unread and chatroom seeding
│   │   ├── querySocketMessage.js              ← Socket message insertion with profile lookup
│   │   └── queryReset.js                      ← Password reset queries
│   │
│   ├── middleware/                            ← Express middleware
│   │   ├── authMiddleware.js                  ← JWT verification and role-based access
│   │   ├── uploadMiddleware.js                ← Multer + Cloudinary for profile pictures
│   │   ├── audioUploadMiddleware.js           ← Dedicated audio upload handler
│   │   └── validateRequest.js                 ← Zod schema validation
│   │
│   ├── validation/                            ← Zod validation schemas
│   │   ├── authValidation.js                  ← Register, login, reset password schemas
│   │   ├── channelValidation.js               ← Channel creation and update schemas
│   │   └── instituteValidation.js             ← Institute creation schema
│   │
│   ├── stores/                                ← In-memory data stores
│   │   └── onlineUsers.js                     ← Online user tracking for presence
│   │
│   └── utils/                                 ← Utility functions
│       └── sendResetEmail.js                  ← Nodemailer email sending
│
└── frontend/                                  ← React + Vite SPA
    ├── 📘 README.md                           ← Detailed frontend documentation
    ├── index.html
    ├── vite.config.js                         ← Vite configuration with API proxy
    ├── tailwind.config.js                     ← Tailwind CSS configuration
    ├── package.json
    │
    └── src/
        ├── main.jsx
        ├── App.jsx                            ← Layout shell, routing, state management
        │
        ├── pages/
        │   └── LoginPage.jsx                  ← Login, register, password reset flows
        │
        ├── components/
        │   ├── Sidebar.jsx                    ← Channels + Inbox tab + backend-seeded recent chats
        │   ├── Inbox.jsx                      ← DM list + member search + full-text message search
        │   ├── ChatArea.jsx                   ← Channel + P2P chat with audio recording support
        │   ├── ChatHeader.jsx                 ← Channel header + P2P header with avatar popover
        │   ├── MessageList.jsx                ← Scrollable messages with typing indicator and audio playback
        │   ├── MessageItem.jsx                ← Message bubble with audio player, copy/edit/delete, mobile menu
        │   ├── MessageInput.jsx               ← Textarea with send, cancel, audio button, auto-resize
        │   ├── ChatSkelton.jsx                ← Loading skeleton screens
        │   ├── UserProfilePanel.jsx           ← Own profile editor with photo upload via Cloudinary
        │   ├── UserProfilePopover.jsx         ← Other user's profile popup + Direct Message button
        │   ├── InstituteSidebar.jsx           ← Institute management panel for admins
        │   ├── InstituteGate.jsx              ← Create / join institute gateway
        │   ├── CreateChannelModal.jsx         ← Channel creation form with validation
        │   ├── ChangePasswordModal.jsx        ← Password change form with current password verification
        │   ├── Avatar.jsx                     ← Reusable avatar component (image or initials fallback)
        │   └── Toast.jsx                      ← Toast notifications for user feedback
        │
        ├── services/
        │   ├── AuthContext.jsx                ← Auth state with updateUser and on-mount refresh
        │   ├── api.js                         ← Axios instance with JWT interceptor for REST calls
        │   ├── p2p-api.js                     ← P2P-specific API calls and room management
        │   └── socket.js                      ← Socket.io singleton with reconnection logic
        │
        ├── utils/
        │   ├── time.js                        ← Time formatting utilities
        │   └── dateFormat.js                  ← Date formatting utilities
        │
        └── styles/
            ├── globals.css                    ← Tailwind directives and custom utilities
            ├── app.css                        ← Application-specific styles
            └── Toast.css                      ← Toast and banner animations
```

---

## 🔐 Authentication & Security

### Login & Registration Flow

1. **Register** — User provides username, email, password, and role (admin or member)
2. **Verification** — Password is hashed with bcrypt (10 salt rounds) and stored securely
3. **Institute Joining** — User can join an existing institute using its UUID
4. **Login** — Email and password verified, JWT token issued (24-hour expiration)
5. **Token Storage** — JWT stored in localStorage with automatic interceptor injection
6. **Session Hydration** — On page load, auth context fetches fresh user data from `/auth/user-info` endpoint

### Admin Features & Role-Based Access Control

Users with `role = 'admin'` can:
- Create, rename, and delete channels within their institutes
- Delete any message in their institute channels
- View institute dashboard with member statistics
- Manage institute members and their roles

All admin checks are enforced at the API level — the frontend hides UI as a convenience only. Users cannot bypass restrictions by modifying client code.

### Password Reset & Email Verification

1. User requests password reset with email address
2. 6-digit code generated and sent via Gmail (Nodemailer)
3. User submits code + new password to `/auth/reset-password`
4. Password updated and code invalidated with expiration timestamp

### JWT Token Management

- **Expiration**: 24 hours from issue time
- **Payload**: User ID, email, role, username, creation timestamp
- **Refresh**: Automatic on login; does not refresh automatically on expiration (user re-login required)
- **Storage**: localStorage with axios interceptor for automatic injection on all API calls

---

## 🖼️ Profile Pictures & Media

### Profile Picture Upload

Profile pictures are uploaded and managed through Cloudinary integration:

1. User selects image file (JPG, PNG, WebP, AVIF) in profile panel
2. Multer uploads file to Cloudinary using the `uploadMiddleware`
3. Cloudinary returns `secure_url` which is saved to `users.profile_picture` in PostgreSQL
4. `AuthContext.updateUser()` updates React state and localStorage immediately
5. Profile picture appears in:
   - **Sidebar footer** — current user's avatar
   - **Inbox** — recent chats list avatars
   - **Message bubbles** — sender avatars in channel and P2P messages
   - **Chat headers** — DM participant avatar (clickable)
   - **Profile popovers** — full user profile card
   - **Socket payloads** — real-time message events include profile picture URL

### Audio Message Storage

Audio messages are stored on Cloudinary with automatic lifecycle management:

1. User records audio in message input
2. Audio blob uploaded via multipart form to `/api/messages/upload-audio`
3. Cloudinary stores in `mizuka_audio_messages` folder with `video` resource type (supports audio codecs)
4. Secure URL returned and stored in message content
5. Audio embedded in chat with playable inline player
6. On message deletion, Cloudinary file automatically cleaned up via `cloudinary.uploader.destroy()`

---

## 📡 Real-Time Features & Socket.io

### Unified Socket Handler Architecture

All Socket.io events flow through a single `unifiedHandler` function that:
- Manages user presence tracking with an online users Map
- Routes channel and P2P events to respective controllers
- Handles connection/disconnection lifecycle
- Emits status updates to all connected clients

### Channel Events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join_institute` | Client → Server | `channelId` | Join a channel room for real-time updates |
| `leave_institute` | Client → Server | `channelId` | Leave a channel room |
| `send_message` | Client → Server | `{ channel_id, sender_id, message, type }` | Send channel message |
| `receive_message` | Server → Client | Full message with profile picture | Broadcast new message to room |
| `Display_typing` | Client → Server | `{ channel_id, username }` | Notify others of typing |
| `hide_typing` | Client → Server | `{ channel_id }` | Stop typing notification |
| `channel_created` | Server → Client | `{ channel, instituteId }` | Notify of new channel |
| `channel_renamed` | Server → Client | `{ channel, instituteId }` | Notify of channel name change |
| `channel_deleted` | Server → Client | `{ channelId, instituteId }` | Notify of channel deletion |

### P2P Events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join_p2p` | Client → Server | `roomId` | Join P2P chatroom |
| `leave_p2p` | Client → Server | `roomId` | Leave P2P chatroom |
| `send_p2p_message` | Client → Server | `{ chatroom_id, message, sender_id, username, type }` | Send P2P message |
| `receive_p2p_message` | Server → Client | Full message with profile and read status | Deliver new P2P message |
| `Display_p2p_typing` | Client → Server | `{ room_id, username }` | Show typing indicator |
| `hide_p2p_typing` | Client → Server | `{ room_id }` | Clear typing indicator |
| `delete_p2p_message` | Client → Server | `{ roomId, messageId }` | Mark message as deleted |
| `p2p_message_deleted` | Server → Client | `{ messageId, newContent }` | Notify deletion across room |
| `edit_p2p_message` | Client → Server | `{ roomId, messageId, content }` | Update message content |
| `p2p_message_edited` | Server → Client | `{ messageId, newContent }` | Broadcast edit to room |

### Presence Events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `user_online` | Client → Server | `userId` | Mark user as online |
| `update_user_status` | Server → Client | `{ userId, status }` | Broadcast user status change |
| `get_online_users` | Client → Server | None | Request list of online users |
| `online_users_list` | Server → Client | `[userId, ...]` | Send online user IDs |
| `join_user_room` | Client → Server | `userId` | Join user-specific notification room |

### Message Payload Structure

Both channel and P2P messages emit with the following structure:

```javascript
{
  id: "message-uuid",
  content: "text content or audio URL",
  type: "text" | "audio",
  sender_id: "user-uuid",
  username: "sender_username",
  profile_picture: "https://cloudinary.url/...",
  created_at: "2026-03-25T10:30:00Z",
  is_read: false,  // P2P only
  chatroom_id: "room-uuid"  // P2P only
}
```

Full Socket.io event documentation available in `backend/README.md`.

---

## 🗄️ Database Schema & Indexes

### Complete Schema

The database consists of 8 core tables:

**institutes** — Organization containers for users and channels
**users** — User accounts with authentication and profile data
**user_institutes** — Membership junction table with role tracking
**channels** — Communication channels within institutes
**messages** — Channel messages with type support
**p2p_chatrooms** — Direct message room pairs with uniqueness constraints
**p2p_messages** — P2P messages with read status and soft delete
**password_resets** — Temporary reset tokens with expiration

### Optimized Indexes

The following indexes ensure fast queries for common operations:

```sql
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_p2p_room_users ON p2p_chatrooms (user_one_id, user_two_id);
CREATE INDEX idx_p2p_messages_room ON p2p_messages (chatroom_id);
CREATE INDEX idx_p2p_messages_time ON p2p_messages (created_at DESC);
CREATE INDEX idx_p2p_messages_unread 
  ON p2p_messages (chatroom_id, sender_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX idx_p2p_msgs_chatroom_time 
  ON p2p_messages (chatroom_id, created_at DESC);
CREATE INDEX idx_p2p_msgs_unread_active
  ON p2p_messages (sender_id) 
  WHERE is_read = false AND is_deleted = false;
CREATE INDEX idx_p2p_chatrooms_participants 
  ON p2p_chatrooms (user_one_id, user_two_id);
CREATE INDEX idx_user_institutes_institute_id 
  ON user_institutes(institute_id);
```

### Using Neon for Cloud Database (Recommended)

For cloud-hosted development:

1. Sign up at [neon.tech](https://neon.tech)
2. Create a PostgreSQL project
3. Copy the connection string to `DATABASE_URL` in `.env`
4. Run schema SQL in Neon's SQL editor or via psql:
   ```bash
   psql "postgresql://..." < schema.sql
   ```

---

## 🔄 Request Validation with Zod

All API endpoints validate request bodies using Zod schemas. This ensures type safety and consistent error messages.

### Auth Validation

```javascript
registerSchema: {
  username: string, min 3 chars
  email: valid email format
  password: string, min 6 chars
  role: optional, enum('admin', 'member')
  institute_id: optional, uuid string
}

loginSchema: {
  email: valid email format
  password: required string
}

resetPasswordSchema: {
  newPassword: string, min 6 chars
  code: string, min 6 chars
}

requestPasswordResetSchema: {
  email: valid email format
}

deleteSchema: {
  email: valid email format
  password: required string
}
```

### Channel Validation

```javascript
createChannelSchema: {
  name: string, 2-64 chars, lowercase/numbers/hyphens/underscores only
  institute_id: required uuid string
  is_private: optional boolean
}

updateChannelSchema: {
  name: optional, same format as create
  is_private: optional boolean
}
```

### Institute Validation

```javascript
createInstituteSchema: {
  name: string, 2-100 chars, letters/numbers/spaces/hyphens/underscores
}
```

### Error Handling

Validation failures return 400 with human-readable messages:

```json
{
  "message": "Username must be at least 3 characters long, Invalid email format"
}
```

---

## 🧪 Testing the API

Use any REST client (VS Code REST Client, Postman, Insomnia, curl):

### Register New User

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"
}
```

### Login

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Channel

```http
POST http://localhost:3000/api/channel/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "announcements",
  "institute_id": "institute-uuid",
  "is_private": false
}
```

### Send Channel Message

Connect to Socket.io and emit:

```javascript
socket.emit('send_message', {
  channel_id: 'channel-uuid',
  sender_id: 'user-uuid',
  message: 'Hello everyone!',
  type: 'text'
});
```

### Upload Audio Message

```http
POST http://localhost:3000/api/messages/upload-audio
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

[binary audio file]
```

### Get P2P Chat History

```http
GET http://localhost:3000/api/p2p/messages/chatroom-uuid
Authorization: Bearer YOUR_JWT_TOKEN
```

### Search Messages

```http
GET http://localhost:3000/api/channel/channelId/search-messages?searchTerm=hello
Authorization: Bearer YOUR_JWT_TOKEN
```

Complete API reference in `backend/README.md`.

---

## 📚 Detailed Documentation

| Location | File | Contents |
|---|---|---|
| `backend/` | `README.md` | Full API endpoint reference, socket event contract, database schema |
| `frontend/` | `README.md` | Component architecture, state management, CSS design tokens, mobile behavior |

---

## 🌐 Live Demo

**[connect-mizuka.vercel.app](https://connect-mizuka.vercel.app)**

> The backend runs on Koyeb free tier. First load after inactivity may take ~30 seconds — the app displays a "waking banner" informing users of the startup process.

---

## 🐛 Troubleshooting

### Port Already in Use

Change the port in your `.env` file:

```env
PORT=4000
```

Then restart the backend server.

### Profile Picture Not Uploading

Verify that your Cloudinary credentials are correctly set:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Check that the `uploadMiddleware.js` is properly configured and the `/api/auth/update-profile` route has the upload middleware attached.

### Profile Picture Not Appearing for Existing Users

The `AuthContext` fetches `/api/auth/user-info` on component mount to hydrate profile pictures for users who logged in before the feature was added. Verify:

1. Endpoint returns `profile_picture` field
2. Frontend stores and displays the field from localStorage
3. Socket payloads include `profile_picture` in message events

### Audio Messages Not Playing

Ensure:

1. Audio uploaded successfully to Cloudinary (check cloud dashboard)
2. Cloudinary URL is accessible and CORS-enabled
3. Browser supports the audio format (typically WebM, MP3, WAV)
4. Audio playback component properly renders `<audio>` tag

### Socket.io Connection Fails

Verify:

1. Backend running on port 3000
2. Frontend Socket.io client configured to connect to correct server
3. CORS is properly configured in `app.js` with your frontend URL
4. Firewall/network allows WebSocket connections

### Database Connection Error

Test your PostgreSQL connection:

```bash
psql "DATABASE_URL_FROM_.ENV"
```

Common issues:

- Wrong credentials in `DATABASE_URL`
- PostgreSQL service not running
- Database doesn't exist (create with `CREATE DATABASE mizuka;`)
- Network access restricted (if using cloud database)

### Message Search Returns Empty

Verify:

1. Messages exist in the database (check with SQL query)
2. Search term matches message content (case-insensitive ILIKE)
3. User has permission to search in that channel
4. Frontend sends correct channel/room IDs

### Email Not Sending

Use a Gmail **App Password** (not your regular Gmail password):

1. Enable 2-factor authentication on Gmail
2. Generate an App Password: myaccount.google.com/apppasswords
3. Use the 16-character password in `EMAIL_PASS`

Check that `EMAIL_USER` matches the Gmail account.

### Recent DM Chats Not Showing

The `/api/p2p/rooms` endpoint seeds recent chats on login. Verify:

1. Endpoint is registered in `p2pRoutes.js`
2. Backend exports `getUserChatrooms` from `p2pController.js`
3. Frontend calls this endpoint in `AuthContext` or component mount
4. User has existing P2P messages (rooms won't appear if no messages)

---

## 🤝 Contributing

We welcome contributions! Follow these steps:

1. **Fork** the repository on GitHub
2. **Create** a feature branch (`git checkout -b feature/your-feature-name`)
3. **Commit** your changes with clear messages (`git commit -m 'feat: add audio recording support'`)
4. **Push** to your fork (`git push origin feature/your-feature-name`)
5. **Open** a Pull Request with detailed description

### Development Guidelines

- Match existing code style — no external state libraries, stick with context API
- All design values must use Tailwind utility classes
- Test on both desktop (Chrome/Firefox) and mobile (Safari/Chrome)
- Update relevant documentation in `backend/README.md` or `frontend/README.md`
- Keep components focused and reusable
- Use TypeScript types in JSDoc comments for clarity

### Building & Testing

```bash
# Backend linting (if configured)
npm run lint

# Frontend type checking
npm run type-check

# Run tests (when available)
npm run test
```

---

## 🎯 Roadmap

### Completed Features
- ✅ Real-time messaging with Socket.io
- ✅ Profile pictures with Cloudinary storage
- ✅ Direct messaging with read status
- ✅ Audio message recording and playback
- ✅ Message search across channels and DMs
- ✅ Password reset via email
- ✅ Role-based access control
- ✅ Multi-institute support
- ✅ Request validation with Zod schemas
- ✅ Unified Socket.io event handler

### In Development
- 🔄 File sharing (documents, PDFs, images)
- 🔄 Message reactions and emoji support
- 🔄 Threaded replies and message threading
- 🔄 Voice and video calling (WebRTC)

### Planned Features
- [ ] Channel pinned messages
- [ ] Admin analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Message encryption (end-to-end)
- [ ] Institute member invitations via email
- [ ] Message reactions and threading
- [ ] Advanced search filters
- [ ] Message scheduling
- [ ] Notification preferences
- [ ] Dark mode theme
- [ ] Internationalization (i18n)

---

## 📊 Project Status

| Component | Status | Notes |
|---|---|---|
| Core Chat (Channels) | ✅ Production Ready | Fully tested and deployed |
| Direct Messages (P2P) | ✅ Production Ready | With read receipts and unread counts |
| Audio Messages | ✅ Complete | Recording, upload, storage, playback |
| Real-Time Messaging | ✅ Stable | Socket.io unified handler |
| Profile Pictures | ✅ Complete | Cloudinary integration, live updates |
| Authentication | ✅ Secure | JWT + password reset with email |
| Database | ✅ Optimized | Indexed queries, constraints |
| Frontend | ✅ Responsive | Tailwind CSS, mobile-optimized |
| REST API | ✅ Complete | All endpoints documented |
| Mobile Experience | ✅ Optimized | Touch-friendly, responsive design |
| Request Validation | ✅ Comprehensive | Zod schemas on all endpoints |
| Email Service | ✅ Integrated | Nodemailer with Gmail |

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for complete terms and conditions.

---

## 👤 Developer

**Zahooruddin (MZ)** — Full-stack developer and project maintainer

- 📧 Email: [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)
- 🐙 GitHub: [@zahooruddin-dev](https://github.com/zahooruddin-dev)
- 🌐 Portfolio: [zahooruddin.dev](https://zahooruddin.dev)

---

## 📬 Support & Feedback

Have questions, found a bug, or want to suggest a feature?

- **GitHub Issues:** [Create an issue](https://github.com/zahooruddin-dev/Mizuka-Connect/issues)
- **Email:** [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)
- **Discussions:** [GitHub Discussions](https://github.com/zahooruddin-dev/Mizuka-Connect/discussions)

---

_Last updated: March 2026 — Comprehensive documentation with audio messaging, Tailwind CSS, and complete backend features_