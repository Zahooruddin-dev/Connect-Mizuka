

# Mizuka Chat Engine Backend

This repository contains the backend for the Mizuka multi-tenant chat engine. It provides REST endpoints, socket handlers, and database queries to support
users, institutes, channels, and real-time messaging. The server is built with Express and PostgreSQL (via the `pg` pool) and is designed for
multi-institute deployments where users may belong to multiple organizations with different roles.

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
├─ app.js                 # entrée point
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
- `POST /api/auth/reset-password` – password reset flow (see `ResetController`)

### Institutes (Admin only)
- `POST /api/institute/create` – create institute + general channel
- `GET  /api/institute/dashboard/:adminId` – list institutes and invite keys

### Channels
- `POST /api/channel/create` – create channel (admin check)
- `GET  /api/channel/:id` – fetch channel info

### Messages
- `POST /api/message/send` – store message and emit via socket
- `GET  /api/message/history/:channelId` – load channel history

> _Refer to controller source files for complete route definitions and required parameters._

---

## 🛠️ Database Migration

The backend now uses a junction table `user_institutes` instead of a single `institute_id` on
`users`. Run the following SQL once:

```sql
-- create junction table for many-to-many relationships
CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, institute_id)
);

-- remove the old column when safe
-- ALTER TABLE users DROP COLUMN institute_id;
```

This allows a single user to hold different roles in different institutes.

---

## 🔐 Security Model

All administrative actions are protected by a **double-lock** mechanism:
1. Verify the `adminId` corresponds to a valid user.
2. Confirm the user has an `'admin'` role for the target `institute_id` in `user_institutes`.

This prevents cross-institute privilege escalation.

---

## 💬 Socket.io Contract

| Event             | Direction | Payload                                                         | Notes                               |
|-------------------|-----------|-----------------------------------------------------------------|-------------------------------------|
| `join_institute`  | client→srv| `{ channel_id }`                                                 | join a UUID room                    |
| `send_message`    | client→srv| `{ channel_id, message, sender_id, username }`                  | field named `message`              |
| `receive_message` | srv→client| `{ id, text, from, timestamp }`                                 | uses `text` instead of `message`   |

Socket logic lives in `Socket-Controllers/messageController.js`.

---

## 🧪 Testing

- Use the included Postman collection (`test.rest`) or your preferred REST client.
- Example SQL files can be found under `SQL/sql.sql` for manual database seeding.

---

## 📝 Notes

- Make sure to keep `.env` values secure.
- When modifying database schema, always test on a development branch (Neon supports
  branch-based migrations).

---

## 🤝 Contributing

Issues and PRs welcome! Please follow the existing code style and add tests where
appropriate.

---

_Last updated: March 2026_

