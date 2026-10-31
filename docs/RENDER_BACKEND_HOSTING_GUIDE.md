# Deploying the Quizzo Backend to Render

This guide walks you through deploying the Quizzo Express + Socket.IO backend to [Render.com](https://render.com) and retrieving your live WebSocket server URL.

---

## 1. What is the WebSocket Server URL?

In Socket.IO, the WebSocket server URL is **the exact same URL as your Render backend HTTPS URL**:

```text
https://your-service-name.onrender.com
```

Render automatically supports WebSockets over standard HTTPS. When the client connects, Socket.IO upgrades the HTTPS connection to a persistent secure WebSocket (`wss://your-service-name.onrender.com/socket.io/`). You do not need a separate port or special `ws://` prefix.

---

## 2. Step-by-Step Deployment on Render

### Step A: Push Code to GitHub / GitLab
Make sure your latest codebase with `render.yaml` and `package.json` is pushed to your GitHub or GitLab repository.

### Step B: Create a Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. In the top-right corner, click **New +** and select **Web Service**.
3. Choose **Build and deploy from a Git repository**, then select your Quizzo repository.

### Step C: Configure Service Settings
Fill in the following fields:

| Field | Value |
| :--- | :--- |
| **Name** | `quizzo-backend` (or your preferred name) |
| **Region** | Choose the region closest to you (e.g., Oregon, Frankfurt, Singapore) |
| **Branch** | `main` (or your active branch) |
| **Root Directory** | Leave blank (workspace root) |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### Step D: Add Environment Variables
Scroll down to the **Environment Variables** section and add:

1. **`NODE_ENV`**: `production`
2. **`JWT_ACCESS_SECRET`**: Enter any random secure string (e.g. `quizzo_prod_secret_94819472`)
3. **`MONGODB_URI`**: Your MongoDB connection string (from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Free M0 cluster):
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/quizzo?retryWrites=true&w=majority
   ```
   *(Note: If you leave `MONGODB_URI` empty, Quizzo will run using its built-in in-memory database store, but data will reset on server restarts).*

### Step E: Click "Deploy Web Service"
Render will build the project and start your server.

---

## 3. How to Verify Your Backend & Get the WebSocket URL

1. Once the deployment status turns to **"Live"**, copy the URL at the top of the Render dashboard:
   ```text
   https://quizzo-backend-xxxx.onrender.com
   ```
   **This is your WebSocket and API URL!**

2. Verify the server is working by opening the health check in your browser:
   ```text
   https://quizzo-backend-xxxx.onrender.com/api/health
   ```
   You should see:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-10-31T...",
     "service": "Quizzo API & Real-time Server",
     "database": "mongodb"
   }
   ```

---

## 4. Connecting Your Frontend (Cloudflare Pages or Local)

Now configure your frontend to point to your new Render backend:

### If Frontend is on Cloudflare Pages:
1. In Cloudflare Dashboard, go to **Workers & Pages** > Your Quizzo Pages Project > **Settings** > **Environment variables**.
2. Add:
   - `VITE_API_URL`: `https://quizzo-backend-xxxx.onrender.com`
   - `VITE_SOCKET_URL`: `https://quizzo-backend-xxxx.onrender.com`
3. Trigger a redeploy.

### If Testing Frontend Locally:
In your local `.env` or `.env.local` file:
```env
VITE_API_URL="https://quizzo-backend-xxxx.onrender.com"
VITE_SOCKET_URL="https://quizzo-backend-xxxx.onrender.com"
```

---

## 5. Pro Tip: Keeping Render Free Tier Awake

Render's Free Web Service spins down after 15 minutes of inactivity. When a player opens the app after inactivity, it takes ~40 seconds for the backend to wake up.

**To keep it awake 24/7 for free:**
1. Create a free account on [cron-job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/).
2. Set up a monitor to ping your health endpoint every 10 minutes:
   ```text
   GET https://quizzo-backend-xxxx.onrender.com/api/health
   ```
This prevents cold starts and ensures players can join games instantly!
