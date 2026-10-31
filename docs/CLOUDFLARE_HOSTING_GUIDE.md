# Hosting Quizzo on Cloudflare

This guide explains how to deploy Quizzo to Cloudflare. Because Quizzo is a full-stack real-time platform with a **React 19 Vite frontend** and a **Node.js Express + Socket.IO (WebSocket) + MongoDB backend**, there are two recommended hosting architectures.

---

## Architecture Overview

| Component | Technology | Recommended Cloudflare Service |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | **Cloudflare Pages** (Global Edge CDN, Free, Fast) |
| **Backend & WebSockets** | Express, Socket.IO, MongoDB | **Cloudflare Tunnel (`cloudflared`)** OR **Cloudflare-Proxied Node Server** |

---

## Method 1: Cloudflare Pages (Frontend) + Managed Node.js (Recommended)

This separates static asset delivery to Cloudflare’s 300+ edge data centers while hosting the Node.js Socket.IO server on your preferred cloud host (Render, Railway, Fly.io, DigitalOcean, or AWS).

### Step 1: Deploy Frontend to Cloudflare Pages

#### Option A: Via Cloudflare Dashboard (GitHub/GitLab Integration)
1. Push your repository to GitHub or GitLab.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Compute (Workers) > Workers & Pages > Create application > Pages**.
3. Select **Connect to Git** and choose your Quizzo repository.
4. Set up the Build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)
5. Under **Environment variables**, add:
   - `VITE_API_URL`: `https://api.yourdomain.com` (your backend URL)
   - `VITE_SOCKET_URL`: `https://api.yourdomain.com` (your WebSocket backend URL)
   - `NODE_VERSION`: `20`
6. Click **Save and Deploy**. Cloudflare Pages will build and host your frontend on a free `.pages.dev` subdomain (or custom domain).

*Note: The SPA routing rules (`public/_redirects`) and caching rules (`public/_headers`) are already included and copied directly to `dist/` on build.*

#### Option B: Via Wrangler CLI
You can also deploy directly from your terminal:
```bash
# 1. Build the frontend
npm run build

# 2. Deploy dist directory to Cloudflare Pages
npx wrangler pages deploy dist --project-name=quizzo
```

---

### Step 2: Deploy Backend & Connect Cloudflare DNS

1. Deploy the Node server (`server.ts` or `npm start`) with your `MONGODB_URI` and `JWT_SECRET` configured on your backend host.
2. In Cloudflare DNS for your domain:
   - Add a DNS record (e.g. `api.yourdomain.com`) pointing to your server.
   - Ensure the proxy status is **Proxied (Orange Cloud)**.
3. In Cloudflare Dashboard, go to **Network**:
   - Ensure **WebSockets** toggle is set to **ON** (Enabled by default on Cloudflare).

---

## Method 2: Cloudflare Tunnel (`cloudflared`) for Full-Stack Server

If you want to host both the frontend and real-time backend together from a single server or VPS (with 0 port forwarding and Cloudflare enterprise DDoS protection + free SSL):

### 1. Install `cloudflared` on your server
```bash
# Linux (Ubuntu/Debian)
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# macOS
brew install cloudflared
```

### 2. Login to Cloudflare
```bash
cloudflared tunnel login
```

### 3. Create a Tunnel
```bash
cloudflared tunnel create quizzo-tunnel
```

### 4. Configure `~/.cloudflared/config.yml`
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/user/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: quiz.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### 5. Route DNS to Tunnel
```bash
cloudflared tunnel route dns quizzo-tunnel quiz.yourdomain.com
```

### 6. Run the Tunnel and Quizzo
```bash
# Start Quizzo production build
npm run build
NODE_ENV=production npm start

# In another terminal / systemd service:
cloudflared tunnel run quizzo-tunnel
```

Now your entire Quizzo app (React UI + REST API + Socket.IO real-time gameplay + MongoDB) is live at `https://quiz.yourdomain.com` with free Cloudflare SSL, DDoS mitigation, and edge caching!

---

## Pre-configured Cloudflare Files in this Project

1. **`public/_redirects`**:
   Ensures deep links like `/dashboard/history`, `/host/:id`, and `/play` load `index.html` without 404 errors.
2. **`public/_headers`**:
   Sets optimal edge caching for assets and security headers (`X-Frame-Options`, `X-Content-Type-Options`).
3. **`wrangler.toml`**:
   Pre-configures project name and Pages output directory (`dist`) for one-command CLI deployments.
4. **`package.json`**:
   Contains `"deploy:pages": "vite build && npx wrangler pages deploy dist"` for quick automated publishing.
