# Mizuka Chat Engine Backend

The backend for the **Mizuka** multi-tenant chat engine. Provides REST endpoints, Socket.io event handlers, and PostgreSQL query helpers to support users, institutes, channels, real-time messaging, peer-to-peer chat, presence tracking, and password reset flows. Built with Express and PostgreSQL (`pg` pool), designed for multi-institute deployments where users may belong to multiple organizations with distinct roles.

---

## 🔧 Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL database (Neon, local, or managed)
- npm / Yarn
- Gmail account (for password reset emails via Nodemailer)

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repo-url> && cd Connect-Mizuka/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root and populate:
   ```text
   PORT=4000
   DATABASE_URL=postgres://user:pass@host:port/dbname
   JWT_SECRET=your_jwt_secret_here
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

4. **Run the server**
   ```bash
   npm run server   # development (nodemon)
   npm start        # production
   ```

---

## 🗂️ Folder Structure

```
backend/
├─ app.js                        # Entry point — Express + Socket.io setup
├─ Controller/
│  ├─ AuthController.js          # Auth logic (login, register, profile, etc.)
│  ├─ channelController.js       # Channel CRUD
│  ├─ instituteController.js     # Institute management
│  ├─ messageController.js       # Channel message history + deletion
│  ├─ p2pController.js           # P2P chatroom + messaging
│  └─ ResetController.js         # Password reset flow
├─ db/
│  ├─ Pool.js                    # pg Pool singleton
│  ├─ queryAuth.js               # User queries
│  ├─ queryChannel.js            # Channel queries
│  ├─ queryInstitute.js          # Institute queries
│  ├─ queryMessage.js            # Channel message queries
│  ├─ queryP2P.js                # P2P message queries
│  ├─ queryReset.js              # Password reset code queries
│  └─ querySocketMessage.js      # Real-time message persistence
├─ middleware/
│  └─ authMiddleware.js          # JWT verification + admin role guard
├─ Routes/
│  ├─ authRoutes.js
│  ├─ channelRoutes.js
│  ├─ instituteRoutes.js
│  ├─ messageRoutes.js
│  └─ p2pRoutes.js
├─ Socket-Controllers/
│  ├─ messageController.js       # Institute/channel socket handlers
│  └─ P2psocketcontroller.js     # P2P socket handlers
└─ utility/
   └─ emailSender.js             # Nodemailer transporter (Gmail)
```

---

## 📦 API Endpoints

All protected routes require a `Bearer <token>` header. Routes marked **[Admin]** additionally require `role = 'admin'` in the JWT payload.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Register a new user; optionally link to an institute |
| POST | `/login` | Public | Login and receive a JWT + user info |
| POST | `/request-reset` | Public | Send a 6-digit reset code to the user's email |
| POST | `/reset-password` | Public | Verify code and set a new password |
| GET | `/my-memberships` | 🔒 | List all institutes the authenticated user belongs to |
| GET | `/user-info` | 🔒 | Get full profile for the authenticated user |
| GET | `/user-profile/:userId` | 🔒 | Get public profile for any user (popover use) |
| PUT | `/update-profile` | 🔒 | Update username, email, and/or password |
| PATCH | `/change-password` | 🔒 | Change password (requires old password) |
| POST | `/link-to-institute` | 🔒 | Join an institute as a member |
| POST | `/delete` | 🔒 | Delete own account (requires email + password) |

### Institutes — `/api/institute`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create` | 🔒 [Admin] | Create a new institute + default "General Hallway" channel, linking the creator as admin |
| GET | `/dashboard` | 🔒 [Admin] | List all institutes the authenticated user administers |
| GET | `/key/:instituteId` | 🔒 [Admin] | Retrieve institute details (name/id) — admin of that institute only |
| GET | `/:instituteId/search-members` | 🔒 | Search institute members by username (`?query=`) |
| GET | `/:instituteId/institute-members` | 🔒 | List all members of an institute |

### Channels — `/api/channel`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create` | 🔒 [Admin] | Create a channel inside an institute |
| PUT | `/:channelId` | 🔒 [Admin] | Update channel name or privacy |
| DELETE | `/:channelId` | 🔒 [Admin] | Delete a channel |
| GET | `/institute/:instituteId` | 🔒 | List all channels for an institute |
| GET | `/:channelId` | 🔒 | Get a single channel by ID |
| GET | `/:channelId/search-messages` | 🔒 | Full-text search messages in a channel (`?searchTerm=`) |

### Messages — `/api/messages`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:channelId` | 🔒 | Paginated channel message history (`?limit=&offset=`) |
| DELETE | `/message/:messageId` | 🔒 | Delete own message from a channel |
| DELETE | `/channel/:channelId` | 🔒 [Admin] | Delete an entire channel and its messages |

### P2P (Direct Messaging) — `/api/p2p`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/room` | 🔒 | Get or create a chatroom between two users |
| GET | `/messages/:roomId` | 🔒 | Load message history for a room (marks as read) |
| GET | `/messages/:roomId/search` | 🔒 | Search messages in a room (`?searchTerm=`) |
| PATCH | `/messages/:messageId/delete` | 🔒 | Soft-delete own P2P message |
| PATCH | `/messages/:messageId/edit` | 🔒 | Edit own P2P message |
| GET | `/unread-counts` | 🔒 | Get unread message counts per chatroom for the authenticated user |
| POST | `/read/:roomId` | 🔒 | Mark all messages in a room as read |

---

## 🛠️ Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Institutes
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

-- Many-to-many user ↔ institute memberships
CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, institute_id)
);

-- Channels
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT FALSE
);

-- Channel messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- P2P chatrooms
CREATE TABLE p2p_chatrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_two_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- P2P messages
CREATE TABLE p2p_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatroom_id UUID REFERENCES p2p_chatrooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset codes
CREATE TABLE password_resets (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```

### Migrations

**P2P read receipts** (if adding to an existing DB):
```sql
ALTER TABLE p2p_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_p2p_messages_unread
  ON p2p_messages (chatroom_id, sender_id, is_read)
  WHERE is_read = FALSE;
```

---

## 🔐 Security Model

### JWT Authentication
All protected routes are gated by `verifyToken` middleware. The token is signed with `JWT_SECRET`, expires in 24 hours, and carries `id`, `email`, `role`, and `username`.

### Admin Double-Lock
All admin-scoped actions (channel create/update/delete, institute management) enforce a two-step check:
1. `restrictToAdmin` middleware verifies `role = 'admin'` in the JWT.
2. `verifyAdminOfInstitute(adminId, instituteId)` confirms the user is the admin of the *specific* institute being modified, preventing cross-institute privilege escalation.

### P2P Participant Guard
P2P message endpoints verify via `isParticipant(roomId, userId)` that the requesting user is `user_one_id` or `user_two_id` of the chatroom before returning or modifying any data.

---

## 💬 Socket.io Contract

The Socket.io server runs on the same HTTP server as Express. All events are handled in `app.js`, `Socket-Controllers/messageController.js`, and `Socket-Controllers/P2psocketcontroller.js`.

### Institute / Channel Events

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `join_institute` | client → server | `channelId` (string) | Join a channel room |
| `leave_institute` | client → server | `channelId` (string) | Leave a channel room |
| `join_institute_room` | client → server | `instituteId` (string) | Join the institute-level broadcast room |
| `send_message` | client → server | `{ channel_id, sender_id, message, username }` | Persists to DB, emits `receive_message` |
| `receive_message` | server → client | `{ id, text, from, username, timestamp, channel_id }` | Broadcast to channel room |
| `channel_created` | client → server | `{ channel, instituteId }` | Broadcasts new channel to institute room |
| `channel_renamed` | client → server | `{ channel, instituteId }` | Broadcasts rename to institute room |
| `channel_deleted` | client → server | `{ channelId, instituteId }` | Broadcasts deletion to institute room |
| `typing` | client → server | `{ channel_id, username }` | Emits `Display_typing` to others in room |
| `stop_typing` | client → server | `{ channel_id }` | Emits `hide_typing` to others in room |

### P2P Events

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `join_p2p` | client → server | `roomId` (string) | Join a P2P room |
| `leave_p2p` | client → server | `roomId` (string) | Leave a P2P room |
| `send_p2p_message` | client → server | `{ chatroom_id, message, sender_id, username }` | Persists and emits `receive_p2p_message` |
| `receive_p2p_message` | server → client | `{ id, chatroom_id, content, sender_id, username, created_at, is_read }` | Broadcast to P2P room |
| `delete_p2p_message` | client → server | `{ roomId, messageId }` | Emits `p2p_message_deleted` to room |
| `p2p_message_deleted` | server → client | `{ messageId, newContent }` | Notifies room of soft-delete |
| `edit_p2p_message` | client → server | `{ roomId, messageId, content }` | Emits `p2p_message_edited` to room |
| `p2p_message_edited` | server → client | `{ messageId, newContent }` | Notifies room of edit |
| `typing_p2p` | client → server | `{ room_id, username }` | Emits `Display_p2p_typing` to others |
| `stop_typing_p2p` | client → server | `{ room_id }` | Emits `hide_p2p_typing` to others |
| `mark_as_read` | client → server | `{ chatroom_id, reader_id }` | Marks unread messages in DB as read |
| `messages_read` | server → client | `{ chatroom_id, reader_id, message_ids }` | Emitted after DB update |

### Presence Events

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `user_online` | client → server | `userId` | Registers user as online; broadcasts `update_user_status` |
| `update_user_status` | server → client | `{ userId, status }` | Broadcast on connect and disconnect |
| `get_online_users` | client → server | — | Request snapshot of online users |
| `online_users_list` | server → client | `[userId, ...]` | Response to `get_online_users` |

---

## 📧 Email (Password Reset)

Password reset uses Nodemailer with a Gmail transporter. When a reset is requested:
1. A 6-digit code is generated and stored in `password_resets` with a 15-minute expiry.
2. The code is emailed to the user via `sendResetEmail`.
3. On verification, the code is deleted and the password hash is updated.

Set `EMAIL_USER` and `EMAIL_PASS` (Gmail App Password) in `.env`.

---

## 🧪 Testing

- Use the included `test.rest` file or any REST client (Postman, Insomnia, etc.).
- Example SQL for manual seeding is available under `SQL/sql.sql`.
- All admin-protected endpoints require a JWT with `role: 'admin'` and a corresponding `user_institutes` row with `role = 'admin'` for the target institute.

---

## 📝 Notes

- Keep `.env` values out of version control.
- P2P chatrooms are keyed by a sorted user ID pair — duplicate rooms between the same two users are prevented at the DB query level.
- Soft-delete for P2P messages sets `is_deleted = true` and replaces `content` with `"This message was deleted"` rather than removing the row.
- When modifying the schema, test on a development branch first (Neon supports branch-based migrations).

---

## 🤝 Contributing

Issues and PRs welcome. Follow the existing code style and add tests where appropriate.

---

_Last updated: March 2026_