# 🚀 TaskFlow — Team Task Manager

A full-stack web application for team collaboration, project management, and task tracking with role-based access control.

---

## 🌐 Live Demo
**[https://your-app.railway.app](https://taskflow-production-e53c.up.railway.app)** ← Replace after deploying

---

## ✨ Features

### Authentication & Authorization
- JWT-based signup/login with secure bcrypt password hashing
- Role-based access control: **Admin** and **Member** roles
- First registered user automatically becomes Admin
- Protected routes on both frontend and backend

### Project Management (Admin)
- Create, view, edit, and delete projects
- Add/remove team members per project
- Project progress bar (completed vs total tasks)
- Track overdue tasks per project

### Task Management
- Create tasks with title, description, priority, due date, assignee
- Kanban-style board (To Do → In Progress → Done)
- Members can update status of their own tasks
- Admins have full CRUD over all tasks

### Dashboard
- Live stats: Total, In Progress, Completed, Overdue tasks
- Recent tasks feed
- Overdue tasks alert panel
- Visual task breakdown progress bar

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Styling | Custom CSS (dark theme, CSS Variables) |
| Backend | Node.js, Express.js |
| Database | JSON file-based persistence (zero-config) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Railway |

---

## 🏗️ Project Structure

```
taskflow/
├── backend/
│   ├── server.js           # Express app entry point
│   ├── db.js               # JSON database layer
│   ├── middleware/
│   │   └── auth.js         # JWT auth + role middleware
│   └── routes/
│       ├── auth.js         # POST /signup, /login, GET /me
│       ├── projects.js     # CRUD projects + members
│       ├── tasks.js        # CRUD tasks + dashboard stats
│       └── users.js        # User listing
├── frontend/
│   └── src/
│       ├── api/client.js   # Axios instance with interceptors
│       ├── context/        # Auth context (React Context API)
│       ├── pages/          # Dashboard, Projects, Tasks, Auth
│       └── components/     # Layout, Sidebar
├── nixpacks.toml           # Railway build config
├── railway.toml            # Railway deploy config
└── README.md
```

---

## 🔌 REST API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | List accessible projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Auth | Project details + members + tasks |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Auth | List user's tasks |
| GET | `/api/tasks/dashboard` | Auth | Dashboard stats |
| GET | `/api/tasks/project/:id` | Auth | Tasks for a project |
| POST | `/api/tasks` | Auth | Create task |
| PUT | `/api/tasks/:id` | Auth | Update task (members: status only) |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Build frontend
npm run build

# Start backend (serves frontend too)
cd ../backend && node server.js
```

Open [http://localhost:5000](http://localhost:5000)

### Development with hot reload

```bash
# Terminal 1 - Backend
cd backend && node server.js

# Terminal 2 - Frontend (with proxy to backend)
cd frontend && npm run dev
```

---

## ☁️ Railway Deployment

1. **Push to GitHub:**
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
   - Select your repo
   - Railway auto-detects `nixpacks.toml` and builds automatically

3. **Environment Variables** (optional, Railway dashboard):
   ```
   JWT_SECRET=your-super-secret-key-here
   PORT=5000
   ```

4. **Done!** Railway gives you a live URL like `https://taskflow-production.up.railway.app`

---

## 🔐 Role-Based Access Control

| Feature | Admin | Member |
|---------|-------|--------|
| Create projects | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Assign tasks to others | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| View project dashboard | ✅ | ✅ |
| View own tasks | ✅ | ✅ |

---

## 📸 Screenshots

> Dashboard, Kanban Board, Projects Grid — see demo video for walkthrough.

---

## 👨‍💻 Author

Built for Ethara AI Campus Recruitment Drive — Mohan Babu University, Class of 2026.
