import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { resolveTrack, searchTracks, getHealth } from './controllers/extract.controller.js';
import { ApiResponse } from './types/index.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4001', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.use(helmet());
app.use(express.json());

// Strict Internal Gateway Only: Disallow public browsers & external CORS
app.use((req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  // Check client IP is loopback
  const remoteIp = req.socket.remoteAddress || '';
  const isLoopback =
    remoteIp === '127.0.0.1' ||
    remoteIp === '::1' ||
    remoteIp === '::ffff:127.0.0.1' ||
    remoteIp.startsWith('10.') ||
    remoteIp.startsWith('172.') ||
    remoteIp.startsWith('192.168.');

  // If a browser tries direct cross-origin access with Origin header, block it
  const origin = req.headers.origin;
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    res.status(403).json({
      success: false,
      error: 'Direct public access forbidden. Extraction service must only be called via AuraSound Gateway.'
    });
    return;
  }

  if (!isLoopback && process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: 'Internal service access restricted to private network.'
    });
    return;
  }

  next();
});

// Extraction Endpoints
app.get('/resolve', resolveTrack);
app.get('/search', searchTracks);
app.get('/health', getHealth);

// 404 Handler
app.use((_req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found on extraction service'
  });
});

// Error Handler
app.use((err: any, _req: Request, res: Response<ApiResponse>, _next: NextFunction) => {
  console.error('Unhandled extraction service error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal error processing extraction request'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`🔒 AuraSound Extraction Microservice bound to http://${HOST}:${PORT}`);
    console.log(`🛡️  Internal Only: Direct public browser access strictly disabled.`);
  });
}

export default app;
