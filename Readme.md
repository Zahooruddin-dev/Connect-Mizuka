# 💬 Mizuka — Real-Time Multi-Institute Chat Engine

> A modern, scalable chat platform designed for educational institutions and organizations. Built with React, Express, PostgreSQL, and Socket.io for seamless real-time communication across multiple institutes.

<!-- [![GitHub](https://img.shields.io/badge/GitHub-zahooruddin--dev-181717?logo=github&logoColor=white)](https://github.com/zahooruddin-dev)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-mizuka.vercel.app-00D9FF?logo=vercel&logoColor=white)](https://mizuka.vercel.app) -->
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🌟 Features

### Core Chat Functionality
- ✅ **Real-Time Messaging** — Instant message delivery powered by Socket.io
- ✅ **Channel-Based Communication** — Organize conversations by institute and topic
- ✅ **Direct Messages (P2P)** — One-on-one private conversations with unread tracking
- ✅ **Typing Indicators** — See who's typing in real-time
- ✅ **Message Search** — Full-text search across channels and conversations
- ✅ **Message Management** — Delete and edit your own messages

### Multi-Tenant Architecture
- ✅ **Multiple Institutes** — Users can belong to and switch between multiple organizations
- ✅ **Role-Based Access** — Admin and member roles with permission enforcement
- ✅ **Member Discovery** — Search and connect with other institute members
- ✅ **Presence Tracking** — See who's online across your institutes

### User Experience
- ✅ **Dark Theme UI** — Beautiful teal-themed interface optimized for clarity
- ✅ **Mobile Responsive** — Works seamlessly on desktop and mobile devices
- ✅ **Secure Authentication** — JWT-based auth with password reset flow
- ✅ **Session Persistence** — Stay logged in across page refreshes

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **Socket.io Client 4** | Real-time WebSocket client |
| **Axios** | HTTP client |
| **Tailwind CSS** | Utility-first styling framework |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API & HTTP server |
| **Socket.io** | Real-time bidirectional communication |
| **PostgreSQL** | Relational database |
| **JWT** | Stateless authentication |
| **Nodemailer** | Email service (password reset) |
| **Bcrypt** | Password hashing |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** (local, Neon, or managed service)
- **npm** or **yarn**
- **Gmail account** (for password reset emails)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/zahooruddin-dev/Mizuka.git
cd Mizuka
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

# Email (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run server    # development (with nodemon)
npm start         # production
```

Backend runs on `http://localhost:3000`

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (if needed):

```env
VITE_API_URL=http://localhost:3000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4️⃣ Access the App

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Test Account:**
- Email: `test@example.com`
- Password: `TestPassword123!`

---

## 📁 Project Structure

```
Mizuka/
├── 📖 README.md                    ← You are here
├── 📋 LICENSE
│
├── backend/                        ← Express + Socket.io API
│   ├── 📘 BACKEND.md              ← Detailed backend documentation
│   ├── app.js                     ← Server entry point
│   ├── package.json
│   ├── .env.example               ← Environment template
│   │
│   ├── Controller/                ← Business logic
│   │   ├── AuthController.js
│   │   ├── channelController.js
│   │   ├── messageController.js
│   │   ├── p2pController.js
│   │   └── ...
│   │
│   ├── Routes/                    ← API routes
│   │   ├── authRoutes.js
│   │   ├── channelRoutes.js
│   │   └── ...
│   │
│   ├── db/                        ← Database & queries
│   │   ├── Pool.js
│   │   ├── queryAuth.js
│   │   ├── queryChannel.js
│   │   └── ...
│   │
│   ├── Socket-Controllers/        ← Real-time handlers
│   │   ├── messageController.js
│   │   └── P2psocketcontroller.js
│   │
│   ├── middleware/                ← Authentication guards
│   │   └── authMiddleware.js
│   │
│   └── utility/                   ← Helpers
│       └── emailSender.js
│
├── frontend/                      ← React + Vite SPA
│   ├── 📘 FRONTEND.md             ← Detailed frontend documentation
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   │
│   ├── src/
│   │   ├── main.jsx               ← React entry point
│   │   ├── App.jsx                ← Root app shell
│   │   │
│   │   ├── pages/                 ← Full-page components
│   │   │   └── LoginPage.jsx
│   │   │
│   │   ├── components/            ← Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatArea.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── InstitutePanel.jsx
│   │   │   └── ...
│   │   │
│   │   ├── services/              ← API & state management
│   │   │   ├── AuthContext.jsx
│   │   │   ├── api.js
│   │   │   ├── p2p-api.js
│   │   │   └── socket.js
│   │   │
│   │   ├── utils/                 ← Helper functions
│   │   │   └── time.js
│   │   │
│   │   └── styles/                ← Global CSS
│   │       ├── global.css
│   │       └── app.css
│   │
│   └── public/                    ← Static assets
│
└── docs/                          ← (Optional) Additional documentation
    ├── API.md
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```

---

## 🔐 Authentication & Security

### Login & Registration

1. **Register** → Provide username, email, password, and role (member/admin)
2. **Login** → Receive JWT token valid for 24 hours
3. **Join Institute** → Use an institute UUID to become a member or link existing account
4. **Switch Institutes** → Toggle between multiple institutes seamlessly

### Admin Features

Only users with `role = 'admin'` can:
- Create and manage channels
- Delete channels and messages
- Rename channels
- View institute member list and dashboard

---

## 📡 Real-Time Features

### WebSocket Events

The app uses **Socket.io** for real-time communication:

**Channels:**
- Send and receive messages instantly
- See typing indicators in real-time
- Get notifications when channels are created/renamed/deleted

**Direct Messages (P2P):**
- One-on-one conversations with unread tracking
- Real-time message delivery
- Online status indicators

See `FRONTEND.md` and `BACKEND.md` for complete Socket.io contracts.

---

## 🗄️ Database Setup

### Quick Start (PostgreSQL)

1. **Create database:**
   ```bash
   createdb mizuka
   ```

2. **Run schema setup** (provided in `backend/db/`):
   ```sql
   -- See BACKEND.md for full schema
   ```

3. **Connection string:**
   ```
   DATABASE_URL=postgres://user:password@localhost:5432/mizuka
   ```

### Using Neon (Recommended for Development)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a PostgreSQL project
3. Copy the connection string to `.env`
4. Tables are auto-created on first run (with proper migrations)

---

## 🧪 Testing the API

### Using REST Client

Install a REST client extension:
- **VS Code:** REST Client by Huachao Mao
- **Postman** or **Insomnia** (standalone apps)

Example request:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

See `BACKEND.md` for the complete API reference.

---

## 📚 Detailed Documentation

Each folder contains comprehensive documentation:

| Folder | Documentation | Topics Covered |
|--------|---------------|---|
| **frontend/** | [`FRONTEND.md`](./frontend/FRONTEND.md) | React components, Socket.io setup, state management, design system |
| **backend/** | [`BACKEND.md`](./backend/BACKEND.md) | REST endpoints, database schema, authentication, Socket.io events |

**Start here:**
- **New to frontend?** → Read [`frontend/FRONTEND.md`](./frontend/FRONTEND.md)
- **New to backend?** → Read [`backend/BACKEND.md`](./backend/BACKEND.md)
- **Deploying?** → Check deployment guides in respective folders

---

## 🌐 Live Demo

Check out the live version: **[mizuka.vercel.app](https://mizuka.vercel.app)**

Test credentials are available after registration.

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use?**
```bash
# Change port in .env
PORT=4000
```

**Database connection error?**
```bash
# Verify DATABASE_URL in .env
# Test connection: psql $DATABASE_URL
```

**Socket.io not connecting?**
- Check that backend is running on `http://localhost:3000`
- Verify Vite proxy is configured correctly (see `frontend/vite.config.js`)
- Browser console should show no CORS errors

**Email not sending?**
- Use Gmail App Password (not regular password)
- Enable "Less secure app access" if using older Gmail account
- Check `EMAIL_USER` and `EMAIL_PASS` in `.env`

See `FRONTEND.md` and `BACKEND.md` for more detailed troubleshooting.

---

## 🤝 Contributing

Contributions are welcome! Here's how to help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and naming conventions
- Add tests for new features
- Update documentation when changing API or features
- Test on both desktop and mobile before submitting PR

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

---

## 👤 About the Developer

**Zahooruddin (MZ)**
- 📧 Email: [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)
- 🐙 GitHub: [@zahooruddin-dev](https://github.com/zahooruddin-dev)
- 🌐 Portfolio: [mizuka.vercel.app](https://mizuka.vercel.app)

---

## 📬 Support & Questions

Have questions or found a bug?

- **GitHub Issues:** [Create an issue](https://github.com/zahooruddin-dev/Mizuka/issues)
- **Email:** [mzkhan886@gmail.com](mailto:mzkhan886@gmail.com)
- **Check docs first:** Review `FRONTEND.md` or `BACKEND.md` for detailed answers

---

## 🎯 Roadmap

### Planned Features
- [ ] File sharing & attachment uploads
- [ ] Voice & video calling
- [ ] Message reactions & threading
- [ ] Channel pinned messages
- [ ] Admin analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Dark/Light theme toggle
- [ ] Message encryption

### In Progress
- Unread message badge optimization
- P2P message search improvements
- Institute member invitations via email

---

## 🙏 Acknowledgments

- **Socket.io** — for real-time WebSocket magic
- **PostgreSQL** — for reliable data persistence
- **Vite** — for blazing-fast frontend development
- **Express** — for the robust backend framework
- The open-source community for countless libraries and tools

---

## 📊 Project Status

| Component | Status |
|-----------|--------|
| Core Chat (Channels) | ✅ Production Ready |
| Direct Messages (P2P) | ✅ Production Ready |
| Real-Time Messaging | ✅ Stable |
| Authentication | ✅ Secure |
| Database | ✅ Optimized |
| Frontend (React) | ✅ Responsive |
| API (REST) | ✅ Complete |

---

<div align="center">

**Made with ❤️ by Zahooruddin**

[⭐ Star on GitHub](https://github.com/zahooruddin-dev) • [🐛 Report Bug](https://github.com/zahooruddin-dev/Mizuka/issues) • [💡 Request Feature](https://github.com/zahooruddin-dev/Mizuka/issues)

</div>

---

_Last updated: March 2026_ | [View Changelog](CHANGELOG.md)