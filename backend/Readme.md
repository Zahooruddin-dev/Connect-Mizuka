# Mizuka Connect — Backend

Node.js + Express + Socket.io + PostgreSQL backend powering the Mizuka Connect
chat platform.

## Stack

| Layer        | Technology                      |
| ------------ | ------------------------------- |
| Runtime      | Node.js v24                     |
| Framework    | Express v5                      |
| Realtime     | Socket.io v4                    |
| Database     | PostgreSQL (via `pg`)           |
| Auth         | JWT (`jsonwebtoken`) + `bcrypt` |
| File uploads | Multer + Cloudinary             |
| Validation   | Zod                             |
| Email        | Nodemailer                      |
| Dev server   | Nodemon                         |

## Project Structure

```
backend/
├── app.js                          # Express app + Socket.io server entry
├── Routes/
│   ├── authRoutes.js               # Auth endpoints
│   ├── channelRoutes.js            # Channel CRUD
│   ├── instituteRoutes.js          # Institute management
│   ├── messageRoutes.js            # Channel message history
│   └── p2pRoutes.js                # P2P chat endpoints
├── Controller/
│   ├── AuthController.js           # Login, register, profile update
│   ├── channelController.js        # Channel logic
│   ├── instituteController.js      # Institute logic
│   ├── messageController.js        # Channel message REST
│   └── p2pController.js            # P2P REST (rooms, messages, unread)
├── Socket-Controllers/
│   ├── messageController.js        # Channel socket handler
│   └── P2psocketcontroller.js      # P2P socket handler
├── db/
│   ├── Pool.js                     # pg pool singleton
│   ├── queryAuth.js                # User queries
│   ├── queryInstitute.js           # Institute + member queries
│   ├── queryP2P.js                 # P2P room + message queries
│   └── querySocketMessage.js       # Channel message save query
├── middleware/
│   ├── authMiddleware.js           # verifyToken, restrictToAdmin
│   ├── uploadMiddleware.js         # Multer + Cloudinary upload
│   └── validateRequest.js          # Zod validation wrapper
└── validation/
    ├── authValidation.js
    ├── channelValidation.js
    └── instituteValidation.js
```

## Environment Variables

Create a `.env` file in the backend root:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Database Setup

Run this migration once to add the profile picture column:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL;
```

### Core Tables

| Table             | Purpose                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `users`           | User accounts (id, username, email, password_hash, role, profile_picture) |
| `institutes`      | Organisations                                                             |
| `user_institutes` | Many-to-many membership with role                                         |
| `channels`        | Channels belonging to an institute                                        |
| `messages`        | Channel messages                                                          |
| `p2p_chatrooms`   | Direct message rooms (user_one_id, user_two_id)                           |
| `p2p_messages`    | Direct messages with read tracking                                        |

## API Reference

### Auth — `/api/auth`

| Method | Route                   | Auth | Description                                          |
| ------ | ----------------------- | ---- | ---------------------------------------------------- |
| POST   | `/login`                | —    | Login, returns JWT + user                            |
| POST   | `/register`             | —    | Register new user                                    |
| GET    | `/user-info`            | ✓    | Get own profile                                      |
| GET    | `/user-profile/:userId` | ✓    | Get any user's profile                               |
| PUT    | `/update-profile`       | ✓    | Update username / email / password / profile picture |
| PATCH  | `/change-password`      | ✓    | Change password                                      |
| GET    | `/my-memberships`       | ✓    | Get institute memberships                            |
| POST   | `/link-to-institute`    | ✓    | Join an institute                                    |
| POST   | `/request-reset`        | —    | Request password reset email                         |
| POST   | `/reset-password`       | —    | Reset password with code                             |

### Institute — `/api/institute`

| Method | Route                             | Auth  | Description                        |
| ------ | --------------------------------- | ----- | ---------------------------------- |
| POST   | `/create`                         | Admin | Create institute + default channel |
| GET    | `/dashboard`                      | Admin | Get managed institutes             |
| GET    | `/key/:instituteId`               | Admin | Get institute details              |
| GET    | `/:instituteId/search-members`    | ✓     | Search members by username         |
| GET    | `/:instituteId/institute-members` | ✓     | Get all members                    |

### Channel — `/api/channel`

| Method | Route                         | Auth | Description                    |
| ------ | ----------------------------- | ---- | ------------------------------ |
| POST   | `/create`                     | ✓    | Create channel                 |
| GET    | `/:channelId`                 | ✓    | Get channel by ID              |
| GET    | `/institute/:instituteId`     | ✓    | Get all channels for institute |
| PUT    | `/:channelId`                 | ✓    | Rename / update channel        |
| DELETE | `/:channelId`                 | ✓    | Delete channel                 |
| GET    | `/:channelId/search-messages` | ✓    | Search messages in channel     |

### P2P — `/api/p2p`

| Method | Route                         | Auth | Description                       |
| ------ | ----------------------------- | ---- | --------------------------------- |
| POST   | `/room`                       | ✓    | Get or create DM room             |
| GET    | `/rooms`                      | ✓    | Get all DM rooms for current user |
| GET    | `/messages/:roomId`           | ✓    | Get message history               |
| GET    | `/messages/:roomId/search`    | ✓    | Search messages                   |
| PATCH  | `/messages/:messageId/delete` | ✓    | Soft-delete message               |
| PATCH  | `/messages/:messageId/edit`   | ✓    | Edit message                      |
| GET    | `/unread-counts`              | ✓    | Unread counts per room            |
| POST   | `/read/:roomId`               | ✓    | Mark room as read                 |

### Misc

| Method | Route       | Description            |
| ------ | ----------- | ---------------------- |
| GET    | `/api/ping` | Health check (no auth) |

## Socket Events

### Client → Server

| Event                 | Payload                                         | Description                     |
| --------------------- | ----------------------------------------------- | ------------------------------- |
| `user_online`         | `userId`                                        | Register presence               |
| `join_user_room`      | `userId`                                        | Join personal notification room |
| `join_institute_room` | `instituteId`                                   | Subscribe to institute events   |
| `join_institute`      | `channelId`                                     | Join channel room               |
| `leave_institute`     | `channelId`                                     | Leave channel room              |
| `send_message`        | `{ channel_id, message, sender_id, username }`  | Send channel message            |
| `channel_created`     | `{ channel, instituteId }`                      | Broadcast new channel           |
| `channel_renamed`     | `{ channel, instituteId }`                      | Broadcast rename                |
| `channel_deleted`     | `{ channelId, instituteId }`                    | Broadcast deletion              |
| `join_p2p`            | `roomId`                                        | Join DM room                    |
| `leave_p2p`           | `roomId`                                        | Leave DM room                   |
| `send_p2p_message`    | `{ chatroom_id, message, sender_id, username }` | Send DM                         |
| `delete_p2p_message`  | `{ roomId, messageId }`                         | Broadcast delete                |
| `edit_p2p_message`    | `{ roomId, messageId, content }`                | Broadcast edit                  |
| `typing`              | `{ channel_id, username }`                      | Channel typing indicator        |
| `stop_typing`         | `{ channel_id }`                                | Stop channel typing             |
| `typing_p2p`          | `{ room_id, username }`                         | DM typing indicator             |
| `stop_typing_p2p`     | `{ room_id }`                                   | Stop DM typing                  |
| `get_online_users`    | —                                               | Request online user list        |

### Server → Client

| Event                 | Payload                                                                          | Description              |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------ |
| `receive_message`     | `{ id, text, from, username, profile_picture, timestamp, channel_id }`           | New channel message      |
| `receive_p2p_message` | `{ id, chatroom_id, content, sender_id, username, profile_picture, created_at }` | New DM                   |
| `p2p_message_deleted` | `{ messageId, newContent }`                                                      | DM soft-deleted          |
| `p2p_message_edited`  | `{ messageId, newContent }`                                                      | DM edited                |
| `channel_created`     | `{ channel }`                                                                    | New channel in institute |
| `channel_renamed`     | `{ channel }`                                                                    | Channel renamed          |
| `channel_deleted`     | `{ channelId }`                                                                  | Channel deleted          |
| `update_user_status`  | `{ userId, status }`                                                             | Online / offline         |
| `online_users_list`   | `[userId, ...]`                                                                  | Current online users     |
| `Display_typing`      | `{ username, channel_id }`                                                       | Channel typing           |
| `hide_typing`         | `{ channel_id }`                                                                 | Stop channel typing      |
| `Display_p2p_typing`  | `{ username, room_id }`                                                          | DM typing                |
| `hide_p2p_typing`     | `{ room_id }`                                                                    | Stop DM typing           |

## Installation

```bash
cd backend
npm install
```

## Running

```bash
# Development
npm run server

# Production
npm start
```

## Deployment Notes

The backend is hosted on **Koyeb free tier**. On first request after inactivity
the server takes ~30 seconds to wake. The frontend shows a waking banner during
this period, detected by polling `/api/ping`.
