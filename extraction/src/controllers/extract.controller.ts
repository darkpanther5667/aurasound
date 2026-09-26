import { Request, Response } from 'express';
import { ytdlService, YtdlError } from '../services/ytdl.service.js';
import { streamCache } from '../services/cache.service.js';
import { outboundLimiter } from '../services/limiter.service.js';
import { ApiResponse } from '../types/index.js';

export const resolveTrack = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  const videoId = (req.query.videoId as string || '').trim();

  // Validate YouTube Video ID format (11 alphanumeric characters)
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    res.status(400).json({
      success: false,
      error: 'Invalid or missing YouTube video ID',
      code: 'INVALID_PARAMS'
    });
    return;
  }

  // 1. Check in-memory cache for valid unexpired stream
  const cachedStream = streamCache.get(videoId);
  if (cachedStream) {
    res.status(200).json({
      success: true,
      data: cachedStream
    });
    return;
  }

  // 2. Check outbound rate limiter before making network request to YouTube
  const rateLimitCheck = outboundLimiter.tryAcquire();
  if (!rateLimitCheck.allowed) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, try again shortly',
      code: 'RATE_LIMITED'
    });
    return;
  }

  // 3. Execute extraction with error classification & sanitized user messages
  try {
    const streamData = await ytdlService.resolveAudioStream(videoId);
    streamCache.set(videoId, streamData);

    res.status(200).json({
      success: true,
      data: streamData
    });
  } catch (err: any) {
    if (err instanceof YtdlError) {
      const statusCode =
        err.code === 'VIDEO_UNAVAILABLE'
          ? 404
          : err.code === 'AGE_RESTRICTED'
          ? 403
          : err.code === 'RATE_LIMITED'
          ? 429
          : 502;

      const sanitizedMessage =
        err.code === 'VIDEO_UNAVAILABLE'
          ? 'This track is no longer available'
          : err.code === 'AGE_RESTRICTED'
          ? "This track can't be played"
          : err.code === 'RATE_LIMITED'
          ? 'Too many requests, try again shortly'
          : "Couldn't load this track";

      res.status(statusCode).json({
        success: false,
        error: sanitizedMessage,
        code: err.code
      });
      return;
    }

    console.error('[Extraction Service Error]:', err);
    res.status(502).json({
      success: false,
      error: "Couldn't load this track",
      code: 'EXTRACTION_FAILED'
    });
  }
};

export const searchTracks = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    res.status(400).json({
      success: false,
      error: 'Search query parameter "q" is required',
      code: 'INVALID_PARAMS'
    });
    return;
  }

  const limit = Math.min(25, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

  const rateLimitCheck = outboundLimiter.tryAcquire();
  if (!rateLimitCheck.allowed) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, try again shortly',
      code: 'RATE_LIMITED'
    });
    return;
  }

  try {
    const results = await ytdlService.search(query, limit);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err: any) {
    console.error('[Search Extraction Error]:', err);
    res.status(502).json({
      success: false,
      error: "Couldn't load search results",
      code: 'EXTRACTION_FAILED'
    });
  }
};

export const getHealth = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
  const ytDlpVersion = await ytdlService.getVersion();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'AuraSound YouTube Audio Extraction Service',
      version: '1.0.0',
      ytDlpVersion,
      uptimeSeconds: Math.round(process.uptime()),
      cache: streamCache.getStats(),
      outboundRateLimiter: outboundLimiter.getStats()
    }
  });
};
