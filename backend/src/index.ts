import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.routes.js';
import tracksRoutes from './routes/tracks.routes.js';
import eventsRoutes from './routes/events.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import queueRoutes from './routes/queue.routes.js';
import profileRoutes from './routes/profile.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import accountRoutes from './routes/account.routes.js';
import { ApiResponse } from './types/index.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Parsing Middleware
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, '')); // strip trailing slashes

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin?.replace(/\/$/, ''); // strip trailing slash from incoming origin
      // Allow requests with no origin (mobile apps, curl, postman) or wildcard
      if (!normalizedOrigin || allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by AuraSound Gateway CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
app.use('/api', apiRateLimiter);

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'AuraSound Gateway API',
      version: '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/tracks', tracksRoutes);
app.use('/events', eventsRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/queue', queueRoutes);
app.use('/profile', profileRoutes);
app.use('/settings', settingsRoutes);
app.use('/account', accountRoutes);

// Root Welcome Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: '🌌 AuraSound Gateway API',
      version: '1.0.0',
      status: 'operational',
      description: 'Open-source spatial audio streaming platform curated for India',
      github: 'https://github.com/darkpanther5667/aurasound',
      endpoints: {
        health: 'GET /health',
        trending: 'GET /tracks/trending',
        search: 'GET /tracks/search?q=Arijit+Singh',
        stream: 'GET /tracks/:id/stream',
        favorites: 'GET /favorites',
        queue: 'GET /queue'
      }
    }
  });
});

// 404 Route Handler
app.use((_req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found on AuraSound Gateway'
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response<ApiResponse>, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal error occurred'
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ AuraSound Gateway listening on http://localhost:${PORT}`);
    console.log(`🛡️ Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
  });
}

export default app;
