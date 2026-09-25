# 🐳 RentHub Docker Quick Guide

Your project is now fully Dockerized with a production-grade multi-stage setup!

---

## 🚀 How to Run with Docker (1 Command)

Open your terminal in the `RentHubR` folder and run:

```bash
docker compose up --build
```

That's it! Docker will:
1. Build the Node.js backend container (`renthub-user-backend`).
2. Build the React frontend and bundle it into high-performance Nginx (`renthub-user-frontend`).
3. Connect both inside an isolated internal network.

---

## 🌐 Where to Open Your App

Once running, access your application in your browser:
* **Frontend Website**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:3005](http://localhost:3005)

---

## 🛑 Useful Docker Commands

| What you want to do | Command |
| :--- | :--- |
| **Run in background (detached mode)** | `docker compose up -d` |
| **Stop all running containers** | `docker compose down` |
| **View live logs** | `docker compose logs -f` |
| **Rebuild after making code changes** | `docker compose up --build` |
| **Check running status** | `docker compose ps` |

---

## 📂 Docker Architecture Created

* `user/backend/Dockerfile` - Node 20 runtime, installs backend dependencies, and executes `server-supabase.js`.
* `user/backend/.dockerignore` - Prevents large `node_modules` from bloating your image build.
* `user/frontend/Dockerfile` - Multi-stage build (compiles Vite React app, then places files into a light Nginx server).
* `user/frontend/nginx.conf` - Serves the frontend, manages SPA routing (no 404 on page refresh), and proxies `/api/` calls to the backend container.
* `docker-compose.yml` - Connects the entire stack together with a single command.
