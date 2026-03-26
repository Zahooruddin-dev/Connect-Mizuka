# 🔧 Mizuka Connect — Backend API & Real-Time Server

The backend for **Mizuka Connect** — a scalable, multi-tenant chat engine supporting real-time messaging, audio messages, peer-to-peer chat, presence tracking, and password reset flows. Built with Express.js, Socket.io, PostgreSQL, and Cloudinary.

This server powers:
- **REST API** for user authentication, profile management, channels, messages, and institutes
- **Real-time messaging** via Socket.io with unified event handling
- **Audio message storage** via Cloudinary with automatic cleanup
- **Multi-tenant architecture** allowing users to belong to multiple institutes with role-based access
- **WebRTC call signaling** for voice and video calls
- **Email notifications** for password resets via Gmail/Nodemailer

---

## 🔧 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 13+ (local, Neon, or managed service)
- **npm** or **yarn**
- **Cloudinary** account (free tier sufficient for audio/image storage)
- **Gmail account** with App Password (for password reset emails via Nodemailer)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/zahooruddin-dev/Mizuka-Connect.git
cd Mizuka-Connect/backend
npm install
```

### 2. Configure Environment

Create `.env` file in the backend root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:password@localhost:5432/mizuka

# Authentication
JWT_SECRET=your_super_secret_key_here_at_least_32_chars

# Cloudinary (profile pictures & audio messages)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Database

Create PostgreSQL database and run the full schema:

```bash
createdb mizuka
psql mizuka < /path/to/schema.sql
```

Or paste the complete schema (see **Database Schema** section below) into your PostgreSQL client.

### 4. Start the Server

```bash
npm run server    # Development (nodemon auto-reload)
npm start         # Production
```

Server runs on `http://localhost:3000`

---

## 📁 Project Structure

```
backend/
├── app.js                           ← Server entry point with CORS & Socket.io
├── package.json
├── test.rest                        ← REST client requests for testing
│
├── Controller/                      ← Business logic layer
│   ├── AuthController.js            ← Login, register, profile, password
│   ├── channelController.js         ← Channel CRUD & search
│   ├── instituteController.js       ← Institute management & members
│   ├── messageController.js         ← Channel messages & audio upload
│   ├── p2pController.js             ← P2P rooms, messages, unread counts
│   └── ResetController.js           ← Password reset request & verification
│
├── Routes/                          ← API endpoint definitions
│   ├── authRoutes.js                ← Auth endpoints with upload middleware
│   ├── channelRoutes.js             ← Channel management endpoints
│   ├── instituteRoutes.js           ← Institute endpoints with search
│   ├── messageRoutes.js             ← Message CRUD & audio upload
│   └── p2pRoutes.js                 ← P2P room & message endpoints
│
├── handlers/                        ← Socket.io event routing
│   └── unifiedHandler.js            ← Unified Socket.io event dispatcher
│
├── Socket-Controllers/              ← Real-time event logic
│   ├── messageController.js         ← Channel message emission
│   └── P2psocketcontroller.js       ← P2P message emission
│
├── db/                              ← Database query layer
│   ├── Pool.js                      ← PostgreSQL connection pool
│   ├── queryAuth.js                 ← User auth queries
│   ├── queryChannel.js              ← Channel queries with search
│   ├── queryInstitute.js            ← Institute & member queries
│   ├── queryMessage.js              ← Channel message queries
│   ├── queryP2P.js                  ← P2P room & message queries
│   ├── queryReset.js                ← Password reset queries
│   └── querySocketMessage.js        ← Real-time message persistence
│
├── middleware/                      ← Express middleware
│   ├── authMiddleware.js            ← JWT verification & role guards
│   ├── uploadMiddleware.js          ← Profile picture upload (Cloudinary)
│   ├── audioUploadMiddleware.js     ← Audio file upload (Cloudinary)
│   └── validateRequest.js           ← Zod request validation
│
├── validations/                     ← Zod validation schemas
│   ├── authValidation.js            ← Auth request schemas
│   ├── channelValidation.js         ← Channel request schemas
│   └── instituteValidation.js       ← Institute request schemas
│
├── stores/                          ← In-memory data stores
│   └── onlineUsers.js               ← Online user tracking (Map)
│
├── utility/                         ← Utility functions
│   └── emailSender.js               ← Nodemailer transporter (Gmail)
│
└── SQL/
    └── sql.sql                      ← Full database schema
```

---

## 📦 API Endpoints Reference

All protected routes require `Authorization: Bearer <JWT_TOKEN>` header. Routes marked **[Admin]** require `role = 'admin'` in JWT payload.

### Authentication — `/api/auth`

#### Public Endpoints

**POST `/register`** — Register new user
```json
Request:
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member",
  "institute_id": "optional-uuid"
}

Response:
{
  "message": "New user registered",
  "user": { "id", "username", "email", "role" }
}
```

**POST `/login`** — Authenticate user
```json
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login Successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "member",
    "profile_picture": "https://cloudinary.url/...",
    "memberships": [{ "id", "name", "role" }]
  }
}
```

**POST `/request-reset`** — Request password reset
```json
Request:
{ "email": "john@example.com" }

Response:
{
  "message": "Reset code sent to email",
  "email": "john@example.com"
}
```

**POST `/reset-password`** — Reset password with code
```json
Request:
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "newPassword123"
}

Response:
{
  "message": "Password reset successfully"
}
```

#### Protected Endpoints (🔒 requires JWT)

**GET `/user-info`** — Get authenticated user's full profile
```json
Response:
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "member",
    "profile_picture": "https://cloudinary.url/...",
    "created_at": "2026-03-25T10:00:00Z"
  }
}
```

**GET `/user-profile/:userId`** — Get any user's public profile
```json
Response:
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "member",
    "profile_picture": "https://cloudinary.url/...",
    "created_at": "2026-03-25T10:00:00Z"
  }
}
```

**PUT `/update-profile`** — Update profile with optional photo upload
```
Request (multipart/form-data):
- username (optional)
- email (optional)
- currentPassword (if changing password)
- newPassword (optional)
- profile_picture (File, optional)

Response:
{
  "message": "Profile updated",
  "user": { "id", "username", "email", "profile_picture" }
}
```

**PATCH `/change-password`** — Change password
```json
Request:
{
  "oldPassword": "password123",
  "newPassword": "newPassword456"
}

Response:
{
  "message": "Password updated successfully",
  "user": { "id", "username", "email" }
}
```

**GET `/my-memberships`** — List all institutes user belongs to
```json
Response:
{
  "memberships": [
    {
      "id": "institute-uuid",
      "name": "University ABC",
      "role": "admin"
    }
  ]
}
```

**POST `/link-to-institute`** — Join an institute
```json
Request:
{
  "userId": "user-uuid",
  "institute_id": "institute-uuid"
}

Response:
{
  "message": "Linked to institute",
  "membership": { "user_id", "institute_id", "role" }
}
```

**POST `/delete`** — Delete account (requires email & password)
```json
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "User deleted",
  "deleted": { "id" }
}
```

### Institutes — `/api/institute`

**POST `/create`** — Create new institute **[Admin]**
```json
Request:
{ "name": "University ABC" }

Response:
{
  "message": "Institute created",
  "institute": { "id", "name" }
}
```

**GET `/dashboard`** — Admin dashboard **[Admin]**
```json
Response:
{
  "institutes": [
    {
      "id": "uuid",
      "name": "University ABC",
      "role": "admin"
    }
  ]
}
```

**GET `/key/:instituteId`** — Get institute key **[Admin]**
```json
Response:
{
  "id": "institute-uuid",
  "name": "University ABC"
}
```

**GET `/:instituteId/search-members`** — Search institute members 🔒
```
Query: ?query=john

Response:
{
  "users": [
    {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "profile_picture": "https://...",
      "role": "member"
    }
  ]
}
```

**GET `/:instituteId/institute-members`** — List all members 🔒
```json
Response:
{
  "members": [
    {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "profile_picture": "https://...",
      "role": "member"
    }
  ]
}
```

---

## ✅ Additional Notes

- **Preserve secrets:** Never commit `.env` to source control. Use environment-specific configuration (secrets manager, CI/CD variables, or `.env` in ignored files).
- **Keep `JWT_SECRET` long and random** (at least 32 characters) and rotate it if compromised.

## 🧪 Testing

- Use the included `test.rest` file (REST client) or Postman to exercise endpoints quickly.
- Example curl to verify health/auth route:

```bash
curl -i http://localhost:3000/api/auth/user-info -H "Authorization: Bearer <TOKEN>"
```

## 🔐 Environment & Security

- Production deployments should use a managed Postgres (Neon, RDS, etc.) and secure Cloudinary credentials.
- For email, prefer using a transactional email provider (SendGrid, Mailgun) in production instead of Gmail app passwords.
- Ensure CORS `FRONTEND_URL` is set to the deployed frontend origin.

## 📦 Deployment

1. Build and publish the frontend separately (if applicable).
2. Ensure production environment variables are set in your host/CI.
3. Run DB migrations/schema before starting the server.
4. Start the server with `NODE_ENV=production npm start` or use a process manager (PM2, systemd).

## 🛠 Troubleshooting

- If socket connections fail, verify that the frontend is connecting to the correct Socket.io endpoint and that CORS/same-origin settings match.
- If uploads fail, confirm Cloudinary credentials and that files meet size/type expectations.
- For DB connection issues, check `DATABASE_URL` and network access (firewalls/VPC rules).

## 🤝 Contributing

- Contributions are welcome. Open issues for bugs or feature requests and submit pull requests with focused changes.
- Follow existing code patterns and add validations for new endpoints.

## 📬 Contact

- Project maintainer: Zahooruddin (see repository for contact details)
- Repo: https://github.com/zahooruddin-dev/Mizuka-Connect

### Channels — `/api/channel`

**POST `/create`** — Create channel **[Admin]**
```json
Request:
{
  "name": "announcements",
  "institute_id": "institute-uuid",
  "is_private": false
}

Response:
{
  "message": "Channel created",
  "channel": {
    "id": "uuid",
    "name": "announcements",
    "institute_id": "uuid",
    "is_private": false
  }
}
```

**PUT `/:channelId`** — Update channel **[Admin]**
```json
Request:
{
  "name": "general",
  "is_private": false
}

Response:
{
  "message": "Channel updated",
  "channel": { "id", "name", "is_private", "institute_id" }
}
```

**DELETE `/:channelId`** — Delete channel **[Admin]**
```json
Response:
{
  "message": "Channel deleted",
  "channel": { "id", "name" }
}
```

**GET `/institute/:instituteId`** — List channels 🔒
```json
Response:
{
  "channels": [
    { "id", "name", "is_private", "institute_id" }
  ]
}
```

**GET `/:channelId`** — Get channel details 🔒
```json
Response:
{
  "channel": { "id", "name", "is_private", "institute_id" }
}
```

**GET `/:channelId/search-messages`** — Search channel messages 🔒
```
Query: ?searchTerm=hello

Response:
{
  "message": [
    {
      "id": "msg-uuid",
      "channel_id": "uuid",
      "content": "hello world",
      "created_at": "2026-03-25T10:30:00Z",
      "username": "johndoe"
    }
  ]
}
```

**POST `/search-messages`** — Search across multiple channels 🔒
```json
Request:
{
  "channelIds": ["ch-uuid-1", "ch-uuid-2"],
  "searchTerm": "hello"
}

Response:
{
  "messages": [
    {
      "id": "msg-uuid",
      "channel_id": "uuid",
      "content": "hello world",
      "created_at": "2026-03-25T10:30:00Z",
      "username": "johndoe"
    }
  ]
}
```

### Messages — `/api/messages`

**GET `/:channelId`** — Get message history 🔒
```
Query: ?limit=50&offset=0

Response:
[
  {
    "id": "uuid",
    "content": "hello",
    "type": "text",
    "sender_id": "uuid",
    "username": "johndoe",
    "profile_picture": "https://...",
    "created_at": "2026-03-25T10:30:00Z"
  }
]
```

**DELETE `/message/:messageId`** — Delete own message 🔒
```json
Response:
{
  "message": "Message deleted"
}
```

**POST `/upload-audio`** — Upload audio message 🔒
```
Content-Type: multipart/form-data
- audio: File (webm, mp3, wav, ogg, m4a)

Response:
{
  "url": "https://cloudinary.com/...voice.webm"
}
```

### P2P (Direct Messages) — `/api/p2p`

**POST `/room`** — Get or create P2P room 🔒
```json
Request:
{ "otherUserId": "uuid" }

Response:
{
  "chatroom": { "id", "user_one_id", "user_two_id", "created_at" },
  "isNew": false
}
```

**GET `/messages/:roomId`** — Load P2P messages & mark as read 🔒
```
Query: ?limit=50&offset=0

Response:
{
  "messages": [
    {
      "id": "uuid",
      "chatroom_id": "uuid",
      "sender_id": "uuid",
      "username": "johndoe",
      "profile_picture": "https://...",
      "content": "hello",
      "type": "text",
      "is_read": true,
      "created_at": "2026-03-25T10:30:00Z"
    }
  ]
}
```

**GET `/messages/:roomId/search`** — Search P2P messages 🔒
```
Query: ?searchTerm=hello

Response:
{
  "messages": [
    {
      "id": "msg-uuid",
      "chatroom_id": "uuid",
      "content": "hello",
      "created_at": "2026-03-25T10:30:00Z",
      "username": "johndoe"
    }
  ]
}
```

**POST `/messages/search`** — Search across all P2P chats 🔒
```json
Request:
{
  "roomIds": ["room-uuid-1", "room-uuid-2"],
  "searchTerm": "hello"
}

Response:
{
  "messages": [
    {
      "id": "msg-uuid",
      "room_id": "uuid",
      "content": "hello",
      "created_at": "2026-03-25T10:30:00Z",
      "username": "johndoe"
    }
  ]
}
```

**PATCH `/messages/:messageId/delete`** — Soft-delete P2P message 🔒
```json
Response:
{
  "success": true,
  "updatedMessage": {
    "id": "uuid",
    "content": "This message was deleted",
    "type": "text",
    "is_deleted": true
  }
}
```

**PATCH `/messages/:messageId/edit`** — Edit P2P message 🔒
```json
Request:
{ "content": "edited message" }

Response:
{
  "success": true,
  "messageId": "uuid"
}
```

**GET `/unread-counts`** — Get unread counts per room 🔒
```json
Response:
[
  {
    "chatroom_id": "uuid",
    "unread_count": 5
  }
]
```

**POST `/read/:roomId`** — Mark room as read 🔒
```json
Response:
{ "success": true }
```

**GET `/rooms`** — Get user's chatrooms (seeded on login) 🔒
```json
Response:
{
  "rooms": [
    {
      "room_id": "uuid",
      "created_at": "2026-03-25T10:00:00Z",
      "other_user_id": "uuid",
      "other_username": "janedoe",
      "other_profile_picture": "https://...",
      "other_role": "member",
      "other_email": "jane@example.com",
      "last_content": "Hey!",
      "last_type": "text",
      "last_sender_id": "uuid",
      "last_created_at": "2026-03-25T10:30:00Z"
    }
  ]
}
```

---

## 🗄️ Database Schema

### Complete Schema (Run this once on fresh database)

```sql
-- Institutes (organizations)
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

-- User-Institute memberships with role tracking
CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, institute_id)
);

-- Channels for organized communication
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channel messages with type support (text, audio, etc.)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- P2P Chatrooms with user pair uniqueness constraint
CREATE TABLE p2p_chatrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_pair UNIQUE(user_one_id, user_two_id),
    CONSTRAINT separate_users CHECK (user_one_id <> user_two_id)
);

-- P2P Messages with read status and soft delete
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

-- ── INDEXES FOR PERFORMANCE ──

-- Channel messages
CREATE INDEX idx_messages_channel_id ON messages(channel_id);

-- P2P chatrooms
CREATE INDEX idx_p2p_room_users ON p2p_chatrooms (user_one_id, user_two_id);
CREATE INDEX idx_p2p_chatrooms_participants 
ON p2p_chatrooms (user_one_id, user_two_id);

-- P2P messages
CREATE INDEX idx_p2p_messages_room ON p2p_messages (chatroom_id);
CREATE INDEX idx_p2p_messages_time ON p2p_messages (created_at DESC);
CREATE INDEX idx_p2p_msgs_chatroom_time 
ON p2p_messages (chatroom_id, created_at DESC);

-- Unread tracking
CREATE INDEX idx_p2p_messages_unread
  ON p2p_messages (chatroom_id, sender_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX idx_p2p_msgs_unread_active
  ON p2p_messages (sender_id) 
  WHERE is_read = false AND is_deleted = false;

-- Institute membership
CREATE INDEX idx_user_institutes_institute_id ON user_institutes(institute_id);
```

### Using Neon (Cloud PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project and copy the connection string
3. Set `DATABASE_URL` in `.env`
4. Run schema in Neon's SQL editor or via psql:
   ```bash
   psql "postgresql://..." < schema.sql
   ```

---

## 🔐 Security & Authentication

### JWT Authentication

All protected routes are gated by `verifyToken` middleware:
- Extracts JWT from `Authorization: Bearer <token>` header
- Verifies signature with `JWT_SECRET`
- Decodes to get `id`, `email`, `role`, `username`
- Token expires in 24 hours

### Admin Access Control

Two-layer admin verification prevents privilege escalation:

1. **Route-level guard**: `restrictToAdmin` checks `role = 'admin'` in JWT
2. **Database-level guard**: `verifyAdminOfInstitute(adminId, instituteId)` confirms admin owns that specific institute

Example:
```javascript
router.delete(
  '/:channelId',
  restrictToAdmin,           // Checks JWT role
  channelController.deleteChannelById  // Verifies institute ownership
);
```

### P2P Participant Verification

Before returning/modifying P2P messages:
```javascript
const isParticipant = await db.getRoomById(roomId);
if (!(isParticipant.user_one_id === userId || isParticipant.user_two_id === userId)) {
  return res.status(403).json({ error: 'Access Denied' });
}
```

### Password Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- Never stored in plaintext
- Reset codes expire after 15 minutes
- Password change requires verification of current password

---

## 📡 Socket.io Real-Time Architecture

### Unified Event Handler

All Socket.io events route through `handlers/unifiedHandler.js`:

```javascript
module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('user_online', (userId) => { /* ... */ });
    socket.on('send_message', (data) => { /* ... */ });
    socket.on('join_p2p', (roomId) => { /* ... */ });
    // ... all events handled in one file
  });
};
```

Benefits:
- Centralized connection management
- Consistent online user tracking
- Easy to add new events
- No scattered handlers across multiple files

### Message Events

**Channel Messages**:
```javascript
socket.on('send_message', {
  channel_id: 'uuid',
  sender_id: 'uuid',
  message: 'Hello!',
  type: 'text'
  // type can be: 'text' or 'audio'
});

// Broadcast to channel:
io.to(channel_id).emit('receive_message', {
  id: 'uuid',
  content: 'Hello!',
  sender_id: 'uuid',
  username: 'johndoe',
  type: 'text',
  profile_picture: 'https://...',
  created_at: '2026-03-25T10:30:00Z',
  channel_id: 'uuid'
});
```

**P2P Messages**:
```javascript
socket.on('send_p2p_message', {
  chatroom_id: 'uuid',
  message: 'Hey!',
  sender_id: 'uuid',
  username: 'johndoe',
  type: 'audio' // or 'text'
});

// Emit to room + notified room:
io.to(chatroom_id).emit('receive_p2p_message', {
  id: 'uuid',
  chatroom_id: 'uuid',
  content: 'Hey!',
  sender_id: 'uuid',
  username: 'johndoe',
  type: 'audio',
  profile_picture: 'https://...',
  created_at: '2026-03-25T10:30:00Z',
  is_read: false
});
```

### Typing Indicators

```javascript
socket.on('typing', {
  channel_id: 'uuid',
  username: 'johndoe'
});
// Broadcast: io.to(channel_id).emit('Display_typing', {...})

socket.on('stop_typing', { channel_id: 'uuid' });
// Broadcast: io.to(channel_id).emit('hide_typing', {...})
```

### Presence Tracking

```javascript
socket.on('user_online', (userId) => {
  onlineUsers.set(userId, socket.id);
  io.emit('update_user_status', { userId, status: 'online' });
});

socket.on('disconnect', () => {
  onlineUsers.delete(socket.userId);
  io.emit('update_user_status', { userId, status: 'offline' });
});
```

### Call Signaling (WebRTC)

```javascript
socket.on('call:user', {
  toUserId: 'uuid',
  callerId: 'uuid',
  callerUsername: 'johndoe',
  callType: 'audio' | 'video',
  offer: { type: 'offer', sdp: '...' }
});

socket.on('call:answered', {
  to: 'socketId',
  answer: { type: 'answer', sdp: '...' },
  callType: 'audio' | 'video'
});

socket.on('ice-candidate', {
  to: 'socketId',
  candidate: { candidate: '...', sdpMLineIndex: 0 }
});
```

---

## 🗃️ Request Validation with Zod

All API endpoints validate request bodies using Zod schemas before processing.

### Auth Validation

```javascript
// Register request
{
  username: string (min 3 chars),
  email: valid email format,
  password: string (min 6 chars),
  role: optional, enum('admin', 'member'),
  institute_id: optional UUID string
}

// Login request
{
  email: valid email format,
  password: required string (min 1)
}

// Reset password request
{
  newPassword: string (min 6 chars),
  code: string (min 6 chars)
}
```

### Channel Validation

```javascript
// Create channel
{
  name: string (2-64 chars, lowercase/numbers/hyphens/underscores only),
  institute_id: required UUID,
  is_private: optional boolean
}

// Update channel
{
  name: optional (same format),
  is_private: optional boolean
}
```

### Institute Validation

```javascript
// Create institute
{
  name: string (2-100 chars, letters/numbers/spaces/hyphens/underscores)
}
```

### Error Responses

Validation failures return **400** with human-readable messages:
```json
{
  "message": "Username must be at least 3 characters long, Invalid email format"
}
```

---

## 📁 Middleware

### Authentication Middleware

**authMiddleware.js**:
- `verifyToken` — Extracts & validates JWT, attaches `req.user`
- `restrictToAdmin` — Guards admin-only routes, checks `role = 'admin'`

### File Upload Middleware

**uploadMiddleware.js** — Profile picture uploads via Cloudinary:
- Uses `multer.memoryStorage()` for in-memory file buffering
- Pipes to `cloudinary.uploader.upload_stream()`
- Returns secure URL, stored in `users.profile_picture`
- Max file size: 5MB
- Allowed formats: jpg, png, jpeg, webp, avif

**audioUploadMiddleware.js** — Audio message uploads:
- Dedicated Cloudinary folder: `mizuka_audio_messages`
- Allowed formats: webm, mp3, wav, ogg, m4a
- Auto-cleanup on message deletion via `cloudinary.uploader.destroy()`
- Resource type: 'video' (supports audio codecs)

### Request Validation Middleware

**validateRequest.js**:
```javascript
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues.map(e => e.message).join(', ');
      return res.status(400).json({ message: errorMessage });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
```

---

## 📧 Email & Password Reset

### Setup

Use Gmail with **App Password** (not regular Gmail password):
1. Enable 2-factor authentication
2. Generate App Password at myaccount.google.com/apppasswords
3. Set in `.env`:
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=16_char_app_password
   ```

### Flow

1. **Request Reset**: User submits email → 6-digit code generated → emailed (15-min expiry)
2. **Verify Code**: User submits email + code + new password
3. **Update Password**: Code validated → password hashed → database updated

### Implementation

```javascript
// emailSender.js (Nodemailer transporter)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ResetController.js
const sendResetEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"Mizuka Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Password Reset Code',
    html: `<h1 style="color:#0d9488;">${code}</h1>...`
  });
};
```

---

## 🧪 Testing the API

### Using REST Client

Use `test.rest` file with VS Code REST Client extension:

```http
### Register
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"
}

### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

### Create Channel (Admin only)
POST http://localhost:3000/api/channel/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "announcements",
  "institute_id": "institute-uuid",
  "is_private": false
}
```

### Using Postman

1. Create collection "Mizuka Connect"
2. Set base URL: `{{base_url}}` → `http://localhost:3000`
3. Create variable `token` from login response
4. Use `Authorization` tab → Type: Bearer Token → `{{token}}`

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'

# Protected endpoint (with token)
curl -X GET http://localhost:3000/api/auth/user-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔍 Troubleshooting

### Database Connection Error

**Error**: `ECONNREFUSED 127.0.0.1:5432`

Check:
1. PostgreSQL service running: `pg_isready`
2. Connection string format: `postgres://user:pass@host:port/dbname`
3. Database exists: `psql -l`
4. Credentials correct

### Socket.io Connection Fails

Check:
1. Backend running on correct port
2. CORS origin in `app.js` includes frontend URL
3. Frontend Socket.io client connects to correct server
4. Network allows WebSocket connections

### Cloudinary Uploads Fail

Check:
1. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` set in `.env`
2. Credentials are valid (test in Cloudinary dashboard)
3. Free tier account has available bandwidth

### Email Not Sending

Check:
1. Using Gmail **App Password**, not regular password
2. 2FA enabled on Gmail account
3. `EMAIL_USER` and `EMAIL_PASS` correct in `.env`
4. Gmail account allows less-secure apps (if using regular password)

### Admin Routes Returning 403

Check:
1. User has `role = 'admin'` in JWT
2. User has row in `user_institutes` with `role = 'admin'` for that institute
3. Institute ID matches the one in request

### Messages Not Persisting

Check:
1. Socket handler calls `saveSentMessages()` or `saveP2PMessage()`
2. Database INSERT succeeds (check logs)
3. Message fields match table schema: `content`, `sender_id`, `channel_id`/`chatroom_id`
4. Foreign keys valid (sender exists, channel/room exists)

---

## 📝 Development Notes

- Keep `.env` out of version control (add to `.gitignore`)
- Always verify admin permissions on sensitive routes
- P2P room uniqueness enforced by DB constraint on sorted user IDs
- Soft-delete for P2P messages preserves message history for moderation
- Profile pictures stored as URLs (Cloudinary), not embedded in DB
- Audio files auto-cleanup when message deleted via Cloudinary API

---

## 🚀 Deployment

### Environment Variables for Production

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/mizuka_prod
JWT_SECRET=very_long_secret_key_with_entropy
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret
EMAIL_USER=noreply@company.com
EMAIL_PASS=prod_app_password
FRONTEND_URL=https://yourdomain.com
```

### Deployment Platforms

**Koyeb** (recommended):
```bash
git push koyeb main
# Auto-deploys from Git
```

**Heroku**:
```bash
heroku create mizuka-backend
heroku config:set DATABASE_URL=...
git push heroku main
```

**Render**:
1. Connect GitHub repo
2. Set environment variables
3. Deploy from dashboard

**Railway**:
1. Connect GitHub repo
2. Add PostgreSQL plugin
3. Set env vars from template

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: your feature'`
4. Push: `git push origin feature/your-feature`
5. Open Pull Request

### Code Style

- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add error handling to async operations
- Validate inputs with Zod schemas
- Document complex logic with comments

---

## 📄 License

This project is licensed under the **MIT License** — see LICENSE for details.

---

## 👤 Developer

**Zahooruddin (MZ)**
- 📧 Email: [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)
- 🐙 GitHub: [@zahooruddin-dev](https://github.com/zahooruddin-dev)

---

_Last updated: March 2026 — Complete backend documentation with audio uploads, WebRTC signaling, unified Socket.io handler, and comprehensive API reference_