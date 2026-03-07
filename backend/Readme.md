# Mizuka Chat Engine Backend

This repository contains the backend for the Mizuka multi-tenant chat engine. It provides REST endpoints, socket handlers, and database queries to support users, institutes, channels, real-time messaging, and peer-to-peer chat. The server is built with Express and PostgreSQL (via the `pg` pool) and is designed for multi-institute deployments where users may belong to multiple organizations with different roles.

---

## 🔧 Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL database (Neon, local, or managed)
- npm/Yarn

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
   Copy `.env.example` (if present) to `.env` and update values:
   ```text
   PORT=4000
   DATABASE_URL=postgres://user:pass@host:port/dbname
   JWT_SECRET=your_secret_here
   ```

4. **Run the server**
   ```bash
   npm run server        # starts with nodemon
   npm start             # production mode
   ```

5. **Run tests** (if applicable)
   ```bash
   npm test
   ```

---

## 🗂️ Folder Structure

```
backend/
├─ app.js                 # entry point
├─ Controller/            # express controllers for each resource
├─ db/                    # database pool and query helpers
├─ Routes/                # express routers
├─ Socket-Controllers/    # socket.io event handlers
└─ SQL/                   # raw SQL examples
```

---

## 📦 API Endpoints

### Authentication
- `POST /api/auth/register` – create a new user
- `POST /api/auth/login` – login and receive a JWT
- `POST /api/auth/link-to-institute` – add member relationship
- `GET  /api/auth/my-memberships/:userId` – list institutes for user
- `POST /api/auth/reset-password` – password reset flow

### Institutes (Admin only)
- `POST /api/institute/create` – create institute + general channel
- `GET  /api/institute/dashboard/:adminId` – list institutes and invite keys

### Channels
- `POST /api/channel/create` – create channel (admin check)
- `GET  /api/channel/:id` – fetch channel info

### Messages
- `POST /api/message/send` – store message and emit via socket
- `GET  /api/message/history/:channelId` – load channel history

### P2P (Direct Messaging)
- `POST /api/p2p/room` – get or create a chatroom between two users
- `GET  /api/p2p/messages/:roomId` – load message history for a room
- `GET  /api/p2p/unread/:userId` – get unread message counts per chatroom for a user

> _Refer to controller source files for complete route definitions and required parameters._

---

## 🛠️ Database Migrations

### Multi-institute support
The backend uses a junction table `user_institutes` for many-to-many user–institute relationships:

```sql
CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, institute_id)
);
```

### P2P read receipts
Add the `is_read` column to `p2p_messages` to support read receipts and unread counts:

```sql
ALTER TABLE p2p_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_p2p_messages_unread
  ON p2p_messages (chatroom_id, sender_id, is_read)
  WHERE is_read = FALSE;
```

---

## 🔐 Security Model

All administrative actions are protected by a **double-lock** mechanism:
1. Verify the `adminId` corresponds to a valid user.
2. Confirm the user has an `'admin'` role for the target `institute_id` in `user_institutes`.

This prevents cross-institute privilege escalation.

---

## 💬 Socket.io Contract

### Institute / Channel Events

| Event              | Direction  | Payload                                         | Notes                             |
|--------------------|------------|-------------------------------------------------|-----------------------------------|
| `join_institute`   | client→srv | `{ channel_id }`                                | join a UUID room                  |
| `leave_institute`  | client→srv | `{ channel_id }`                                | leave a UUID room                 |
| `send_message`     | client→srv | `{ channel_id, message, sender_id, username }`  | field named `message`             |
| `receive_message`  | srv→client | `{ id, text, from, timestamp }`                 | uses `text` instead of `message`  |
| `channel_created`  | client→srv | `{ channel, instituteId }`                      | broadcasts to institute room      |
| `channel_renamed`  | client→srv | `{ channel, instituteId }`                      | broadcasts to institute room      |
| `channel_deleted`  | client→srv | `{ channelId, instituteId }`                    | broadcasts to institute room      |
| `typing`           | client→srv | `{ channel_id, username }`                      |                                   |
| `stop_typing`      | client→srv | `{ channel_id }`                                |                                   |

### P2P Events

| Event                 | Direction  | Payload                                                         | Notes                                      |
|-----------------------|------------|-----------------------------------------------------------------|--------------------------------------------|
| `join_p2p`            | client→srv | `roomId`                                                        | join a P2P chat room                       |
| `leave_p2p`           | client→srv | `roomId`                                                        | leave a P2P chat room                      |
| `send_p2p_message`    | client→srv | `{ chatroom_id, message, sender_id, username }`                 |                                            |
| `receive_p2p_message` | srv→client | `{ id, chatroom_id, content, sender_id, username, created_at, is_read }` | emitted to the full room        |
| `typing_p2p`          | client→srv | `{ room_id, username }`                                         |                                            |
| `stop_typing_p2p`     | client→srv | `{ room_id }`                                                   |                                            |
| `mark_as_read`        | client→srv | `{ chatroom_id, reader_id }`                                    | marks all unread messages in room as read  |
| `messages_read`       | srv→client | `{ chatroom_id, reader_id, message_ids }`                       | emitted to room after DB update            |

### Online / Offline Presence Events

| Event                | Direction  | Payload                          | Notes                                         |
|----------------------|------------|----------------------------------|-----------------------------------------------|
| `user_online`        | client→srv | `userId`                         | registers user as online, tags socket         |
| `update_user_status` | srv→client | `{ userId, status }`             | broadcast to all on connect and disconnect    |
| `get_online_users`   | client→srv | —                                | request a snapshot of currently online users  |
| `online_users_list`  | srv→client | `[userId, ...]`                  | response to `get_online_users`                |

Socket logic lives in `Socket-Controllers/messageController.js` and `Socket-Controllers/P2psocketcontroller.js`.

---

## 🧪 Testing

- Use the included Postman collection (`test.rest`) or your preferred REST client.
- Example SQL files can be found under `SQL/sql.sql` for manual database seeding.

---

## 📝 Notes

- Make sure to keep `.env` values secure.
- When modifying database schema, always test on a development branch (Neon supports branch-based migrations).

---

## 🤝 Contributing

Issues and PRs welcome! Please follow the existing code style and add tests where appropriate.

---

_Last updated: March 2026_