import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes.js';
import quizRoutes from './server/routes/quizRoutes.js';
import gameRoutes from './server/routes/gameRoutes.js';
import templateRoutes from './server/routes/templateRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';
import { setupGameSockets } from './server/sockets/gameSocket.js';
import { initMongoDB, isMongoConnected } from './server/mongoService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security and middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Attach Socket.IO
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupGameSockets(io);

// Health check endpoints for Render and cloud load balancers
const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Quizzo API & Real-time Server',
    database: isMongoConnected() ? 'mongodb' : 'in-memory'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.head('/health', (req, res) => res.status(200).end());
app.head('/api/health', (req, res) => res.status(200).end());

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Vite middleware in development vs static serving in production
async function startServer() {
  await initMongoDB();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexHtml = path.resolve(distPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(indexHtml);
      });
    } else {
      app.get('/', (req, res) => {
        res.json({
          status: 'ok',
          service: 'Quizzo API & Real-time Server',
          database: isMongoConnected() ? 'mongodb' : 'in-memory',
          notice: 'Frontend is hosted on Cloudflare'
        });
      });
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Quizzo full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
