# Mizuka Connect

A real-time chat platform for institutes and teams. Create organisations, manage channels, and message people directly — all in one place.

![Stack](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react) ![Stack](https://img.shields.io/badge/Node.js-Express-green?style=flat&logo=node.js) ![Stack](https://img.shields.io/badge/Socket.io-v4-black?style=flat&logo=socket.io) ![Stack](https://img.shields.io/badge/PostgreSQL-blue?style=flat&logo=postgresql)

## Overview

Mizuka Connect is a full-stack chat application where users can:

- Join or create **institutes** (organisations, teams, schools)
- Communicate in real-time via **channels** within an institute
- Send **direct messages** to any institute member
- Upload and display **profile pictures** across the entire UI
- Manage their **profile** (username, password, photo) in-app

## Architecture

```
Mizuka Connect
├── frontend/          React + Vite SPA
└── backend/           Node.js + Express + Socket.io API
```

The frontend communicates with the backend over:
- **REST** (Axios) for data fetching, auth, and management operations
- **WebSocket** (Socket.io) for real-time messages, typing indicators, and presence

## Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL database
- Cloudinary account (for profile pictures)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

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

Run the database migration:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL;
```

```bash
npm run server   # development with nodemon
npm start        # production
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev      # development
npm run build    # production build
```

## Features

### Institutes & Channels
- Admins create institutes with a default General Hallway channel
- Members join via invite key
- Admins can create, rename, and delete channels
- All channel changes broadcast in real time to every connected member

### Real-time Messaging
- Messages delivered instantly via Socket.io
- Typing indicators per channel and per DM
- Message history loaded from the database on open, cached for the session
- Optimistic rendering — messages appear immediately before server confirms

### Direct Messages
- One-to-one conversations between institute members
- Recent conversations always visible on login — seeded from the backend, not just local storage
- Unread badge counts updated in real time
- Inbox auto-switches when a DM is opened from anywhere in the app

### Profile Pictures
- Upload from the profile panel — processed and stored via Cloudinary
- Appears in the sidebar footer, inbox chat list, message avatars, DM header, and profile popover
- Updates everywhere live without re-logging in

### Message Actions
- Copy, edit, and delete your own messages
- Copy any message
- Desktop: actions appear on hover
- Mobile: three-dot menu with a context menu

### Mobile
- Fully responsive — sidebar slides in as a drawer on small screens
- iOS keyboard zoom prevention on all inputs
- Touch-friendly tap targets throughout

## Repository Structure

```
mizuka-connect/
├── README.md                   # This file
├── backend/
│   ├── README.md               # Backend documentation
│   ├── app.js
│   ├── Routes/
│   ├── Controller/
│   ├── Socket-Controllers/
│   ├── db/
│   ├── middleware/
│   └── validation/
└── frontend/
    ├── README.md               # Frontend documentation
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── utils/
    │   └── styles/
    └── public/
```

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 18, Vite, Socket.io client, Axios, Lucide React |
| Backend | Node.js, Express v5, Socket.io v4 |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |
| File storage | Cloudinary |
| Validation | Zod |
| Fonts | Sora, DM Mono |
| Hosting | Koyeb (backend), Vercel / Netlify (frontend) |

## Deployment

The backend is deployed on **Koyeb free tier**. On first request after a period of inactivity the server takes approximately 30 seconds to wake. The frontend displays a waking banner during this period automatically.

For production, set `VITE_API_URL` in the frontend to your deployed backend URL and `FRONTEND_URL` in the backend to your deployed frontend URL.

## Detailed Documentation

- [Backend README](./backend/README.md) — API reference, socket events, database schema
- [Frontend README](./frontend/README.md) — component structure, design system, state management
<div align="center">

**Made with ❤️ by Zahooruddin**

[⭐ Star on GitHub](https://github.com/zahooruddin-dev) • [🐛 Report Bug](https://github.com/zahooruddin-dev/Mizuka/issues) • [💡 Request Feature](https://github.com/zahooruddin-dev/Mizuka/issues)

</div>

---

_Last updated: March 2026_ | [View Changelog](CHANGELOG.md)