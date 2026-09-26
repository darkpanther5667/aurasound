import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { audiusService } from '../services/audius.service.js';
import { youtubeService, ExtractionClientError } from '../services/youtube.service.js';
import { ApiResponse } from '../types/index.js';

// Maximum allowed duration for regular music track searches (15 minutes).
// Excludes full DJ sets, live sessions, podcasts, and long mixes.
export const MAX_TRACK_DURATION_SECONDS = 900;

export const getTrending = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    interface TrendingCandidate {
      source: 'audius' | 'youtube';
      externalId: string;
      title: string;
      artist: string;
      coverUrl: string;
      durationSeconds: number;
      genre?: string;
    }

    const candidates: TrendingCandidate[] = [];

    // 1. Fetch Top Trending Indian hits from YouTube Extraction Service
    try {
      const ytTracks = await youtubeService.search('Trending Songs India Bollywood Punjabi Hits', limit);
      for (const yt of ytTracks) {
        if (
          yt.videoId &&
          /^[a-zA-Z0-9_-]{11}$/.test(yt.videoId) &&
          yt.durationSeconds > 0 &&
          yt.durationSeconds <= MAX_TRACK_DURATION_SECONDS
        ) {
          candidates.push({
            source: 'youtube',
            externalId: yt.videoId,
            title: yt.title,
            artist: yt.artist,
            coverUrl: yt.coverUrl,
            durationSeconds: yt.durationSeconds,
            genre: 'Trending India'
          });
        }
      }
    } catch (err: any) {
      console.warn('[Trending] Indian trending YouTube fetch failed, falling back:', err.message);
    }

    // 2. If YouTube yielded no candidates, fall back to Audius trending catalog
    if (candidates.length === 0) {
      try {
        const audiusTracks = await audiusService.getTrendingTracks(limit);
        for (const at of audiusTracks) {
          candidates.push({
            source: 'audius',
            externalId: at.externalId,
            title: at.title,
            artist: at.artist,
            coverUrl: at.coverUrl,
            durationSeconds: at.durationSeconds,
            genre: at.genre
          });
        }
      } catch (err: any) {
        console.warn('[Trending] Audius fallback failed:', err.message);
      }
    }

    // Upsert candidates into local Postgres database
    const tracksWithDbIds = await Promise.all(
      candidates.map(async (t) => {
        try {
          const dbTrack = await prisma.track.upsert({
            where: {
              source_external_id: {
                source: t.source,
                external_id: t.externalId
              }
            },
            update: {
              title: t.title,
              artist: t.artist,
              cover_url: t.coverUrl,
              duration_seconds: t.durationSeconds
            },
            create: {
              source: t.source,
              external_id: t.externalId,
              title: t.title,
              artist: t.artist,
              cover_url: t.coverUrl,
              duration_seconds: t.durationSeconds
            }
          });

          return {
            id: dbTrack.id,
            source: dbTrack.source,
            externalId: dbTrack.external_id,
            title: dbTrack.title,
            artist: dbTrack.artist,
            coverUrl: dbTrack.cover_url,
            durationSeconds: dbTrack.duration_seconds,
            streamUrl: `/tracks/${dbTrack.id}/stream`,
            genre: t.genre || ''
          };
        } catch {
          return {
            id: t.externalId,
            source: t.source,
            externalId: t.externalId,
            title: t.title,
            artist: t.artist,
            coverUrl: t.coverUrl,
            durationSeconds: t.durationSeconds,
            streamUrl: `/tracks/external/${t.source}/${t.externalId}/stream`,
            genre: t.genre || ''
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: {
        total: tracksWithDbIds.length,
        tracks: tracksWithDbIds
      }
    });
  } catch (err: any) {
    console.error('Trending fetch error:', err);
    res.status(500).json({
      success: false,
      error: "Couldn't load trending catalog"
    });
  }
};

export const searchTracks = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required'
      });
      return;
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const perSourceLimit = Math.ceil(limit / 2);

    // 1. Search cached local tracks in PostgreSQL (excluding channel IDs and 0-duration tracks)
    const localTracks = await prisma.track.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { artist: { contains: query, mode: 'insensitive' } }
            ]
          },
          {
            OR: [
              { source: 'audius' },
              {
                AND: [
                  { source: 'youtube' },
                  { duration_seconds: { gt: 0, lte: MAX_TRACK_DURATION_SECONDS } }
                ]
              }
            ]
          }
        ]
      },
      take: limit
    });

    const seenExternalIds = new Set(localTracks.map((t) => `${t.source}:${t.external_id}`));

    // 2. Query external Audius API
    const audiusPromise = audiusService.searchTracks(query, perSourceLimit).catch((err) => {
      console.warn('[Search] Audius search failed:', err.message);
      return [];
    });

    // 3. Query internal YouTube Extraction Service (with graceful degradation)
    const youtubePromise = youtubeService.search(query, perSourceLimit).catch((err) => {
      console.warn('[Search] YouTube extraction search failed. Gracefully degrading:', err.message);
      return [];
    });

    const [remoteAudiusTracks, remoteYouTubeTracks] = await Promise.all([
      audiusPromise,
      youtubePromise
    ]);

    // Format local cached tracks (ensuring no non-11 char or long-form YouTube tracks)
    const combinedTracks: any[] = localTracks
      .filter((t) => t.source !== 'youtube' || (/^[a-zA-Z0-9_-]{11}$/.test(t.external_id) && t.duration_seconds > 0 && t.duration_seconds <= MAX_TRACK_DURATION_SECONDS))
      .map((t) => ({
        id: t.id,
        source: t.source,
        externalId: t.external_id,
        title: t.title,
        artist: t.artist,
        coverUrl: t.cover_url,
        durationSeconds: t.duration_seconds,
        streamUrl: `/tracks/${t.id}/stream`,
        genre: (t as any).genre || ''
      }));

    // Merge Audius tracks and cache metadata
    for (const audiusTrack of remoteAudiusTracks) {
      const key = `audius:${audiusTrack.externalId}`;
      if (!seenExternalIds.has(key)) {
        seenExternalIds.add(key);

        try {
          const dbTrack = await prisma.track.upsert({
            where: {
              source_external_id: {
                source: 'audius',
                external_id: audiusTrack.externalId
              }
            },
            update: {
              title: audiusTrack.title,
              artist: audiusTrack.artist,
              cover_url: audiusTrack.coverUrl,
              duration_seconds: audiusTrack.durationSeconds
            },
            create: {
              source: 'audius',
              external_id: audiusTrack.externalId,
              title: audiusTrack.title,
              artist: audiusTrack.artist,
              cover_url: audiusTrack.coverUrl,
              duration_seconds: audiusTrack.durationSeconds
            }
          });

          combinedTracks.push({
            id: dbTrack.id,
            source: 'audius',
            externalId: dbTrack.external_id,
            title: dbTrack.title,
            artist: dbTrack.artist,
            coverUrl: dbTrack.cover_url,
            durationSeconds: dbTrack.duration_seconds,
            streamUrl: `/tracks/${dbTrack.id}/stream`,
            genre: audiusTrack.genre
          });
        } catch {
          combinedTracks.push({
            ...audiusTrack,
            source: 'audius',
            streamUrl: `/tracks/external/audius/${audiusTrack.externalId}/stream`
          });
        }
      }
    }

    // Merge YouTube tracks (Strict: must be 11-char ID and 0 < duration <= MAX_TRACK_DURATION_SECONDS)
    for (const ytTrack of remoteYouTubeTracks) {
      if (
        !ytTrack.videoId ||
        !/^[a-zA-Z0-9_-]{11}$/.test(ytTrack.videoId) ||
        !ytTrack.durationSeconds ||
        ytTrack.durationSeconds <= 0 ||
        ytTrack.durationSeconds > MAX_TRACK_DURATION_SECONDS
      ) {
        continue;
      }

      const key = `youtube:${ytTrack.videoId}`;
      if (!seenExternalIds.has(key)) {
        seenExternalIds.add(key);

        try {
          const dbTrack = await prisma.track.upsert({
            where: {
              source_external_id: {
                source: 'youtube',
                external_id: ytTrack.videoId
              }
            },
            update: {
              title: ytTrack.title,
              artist: ytTrack.artist,
              cover_url: ytTrack.coverUrl,
              duration_seconds: ytTrack.durationSeconds
            },
            create: {
              source: 'youtube',
              external_id: ytTrack.videoId,
              title: ytTrack.title,
              artist: ytTrack.artist,
              cover_url: ytTrack.coverUrl,
              duration_seconds: ytTrack.durationSeconds
            }
          });

          combinedTracks.push({
            id: dbTrack.id,
            source: 'youtube',
            externalId: dbTrack.external_id,
            title: dbTrack.title,
            artist: dbTrack.artist,
            coverUrl: dbTrack.cover_url,
            durationSeconds: dbTrack.duration_seconds,
            streamUrl: `/tracks/${dbTrack.id}/stream`,
            genre: (ytTrack as any).genre || ''
          });
        } catch {
          combinedTracks.push({
            id: undefined,
            source: 'youtube',
            externalId: ytTrack.videoId,
            title: ytTrack.title,
            artist: ytTrack.artist,
            coverUrl: ytTrack.coverUrl,
            durationSeconds: ytTrack.durationSeconds,
            streamUrl: `/tracks/youtube/${ytTrack.videoId}/stream`,
            genre: (ytTrack as any).genre || ''
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        query,
        count: combinedTracks.length,
        tracks: combinedTracks.slice(0, limit)
      }
    });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      error: "Couldn't load search results"
    });
  }
};

/**
 * Universal Stream Resolver with Sanitized Error Responses
 */
export const getTrackStream = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Invalid or missing YouTube video ID',
      code: 'INVALID_PARAMS'
    });
    return;
  }

  try {
    // 1. Look up track by ID or external_id in PostgreSQL
    let track = await prisma.track.findFirst({
      where: {
        OR: [{ id }, { external_id: id }]
      }
    });

    // If not found in DB but matches 11-char YouTube ID, resolve directly via extraction service
    if (!track && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      try {
        const resolved = await youtubeService.resolveStream(id);

        track = await prisma.track.upsert({
          where: {
            source_external_id: {
              source: 'youtube',
              external_id: id
            }
          },
          update: {
            title: resolved.title,
            artist: resolved.artist,
            cover_url: resolved.coverUrl,
            duration_seconds: resolved.durationSeconds
          },
          create: {
            source: 'youtube',
            external_id: id,
            title: resolved.title,
            artist: resolved.artist,
            cover_url: resolved.coverUrl,
            duration_seconds: resolved.durationSeconds
          }
        });

        const audioProxyUrl = `/tracks/${track.id}/audio`;

        res.status(200).json({
          success: true,
          data: {
            id: track.id,
            source: 'youtube',
            externalId: track.external_id,
            title: track.title,
            artist: track.artist,
            coverUrl: track.cover_url,
            durationSeconds: track.duration_seconds,
            streamUrl: audioProxyUrl,
            rawStreamUrl: resolved.streamUrl,
            expiresAt: resolved.expiresAt
          }
        });
        return;
      } catch (err: any) {
        if (err instanceof ExtractionClientError) {
          res.status(err.status).json({
            success: false,
            error: err.message,
            code: err.code
          });
          return;
        }
        console.error('[Stream Resolution Error]:', err);
        res.status(502).json({
          success: false,
          error: "Couldn't load this track",
          code: 'EXTRACTION_FAILED'
        });
        return;
      }
    }

    if (!track) {
      res.status(404).json({
        success: false,
        error: 'This track is no longer available',
        code: 'VIDEO_UNAVAILABLE'
      });
      return;
    }

    // 2. Handle YouTube stream resolution
    if (track.source === 'youtube') {
      try {
        const resolved = await youtubeService.resolveStream(track.external_id);
        const audioProxyUrl = `/tracks/${track.id}/audio`;

        res.status(200).json({
          success: true,
          data: {
            id: track.id,
            source: 'youtube',
            externalId: track.external_id,
            title: track.title,
            artist: track.artist,
            coverUrl: track.cover_url,
            durationSeconds: track.duration_seconds,
            streamUrl: audioProxyUrl,
            rawStreamUrl: resolved.streamUrl,
            expiresAt: resolved.expiresAt
          }
        });
        return;
      } catch (err: any) {
        if (err instanceof ExtractionClientError) {
          res.status(err.status).json({
            success: false,
            error: err.message,
            code: err.code
          });
          return;
        }
        console.error('[Stream Resolution Error]:', err);
        res.status(502).json({
          success: false,
          error: "Couldn't load this track",
          code: 'EXTRACTION_FAILED'
        });
        return;
      }
    }

    // 3. Handle Audius stream resolution
    const audioProxyUrl = `/tracks/${track.id}/audio`;

    res.status(200).json({
      success: true,
      data: {
        id: track.id,
        source: 'audius',
        externalId: track.external_id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.cover_url,
        durationSeconds: track.duration_seconds,
        streamUrl: audioProxyUrl,
        expiresAt: null
      }
    });
  } catch (err: any) {
    console.error('Stream resolution error:', err);
    res.status(502).json({
      success: false,
      error: "Couldn't load this track",
      code: 'EXTRACTION_FAILED'
    });
  }
};

/**
 * High-Performance Audio Streaming Proxy with HTTP 206 Partial Content / Range support
 * Resolves upstream YouTube or Audius audio stream and pipes byte chunks to the browser
 * Injects required CORS headers (Access-Control-Allow-Origin: *) so Web Audio API
 * and native HTMLMediaElement play without CORS silences or IP restrictions.
 */
export const proxyTrackAudio = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send('Invalid track ID');
    return;
  }

  try {
    let track = await prisma.track.findFirst({
      where: {
        OR: [{ id }, { external_id: id }]
      }
    });

    let targetStreamUrl: string | null = null;

    if (!track && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      try {
        const resolved = await youtubeService.resolveStream(id);
        targetStreamUrl = resolved.streamUrl;
      } catch (err: any) {
        res.status(502).json({ success: false, error: "Couldn't load this track", code: 'EXTRACTION_FAILED' });
        return;
      }
    } else if (track && track.source === 'youtube') {
      try {
        const resolved = await youtubeService.resolveStream(track.external_id);
        targetStreamUrl = resolved.streamUrl;
      } catch (err: any) {
        if (err instanceof ExtractionClientError) {
          res.status(err.status).json({ success: false, error: err.message, code: err.code });
          return;
        }
        res.status(502).json({ success: false, error: "Couldn't load this track", code: 'EXTRACTION_FAILED' });
        return;
      }
    } else if (track && track.source === 'audius') {
      targetStreamUrl = `https://discoveryprovider.audius.co/v1/tracks/${track.external_id}/stream?app_name=AuraSoundGateway`;
    }

    if (!targetStreamUrl) {
      res.status(404).json({ success: false, error: 'This track is no longer available', code: 'VIDEO_UNAVAILABLE' });
      return;
    }

    // Set essential streaming and CORS headers for browser Web Audio engine
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Accept-Ranges', 'bytes');

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const upstreamRes = await axios.get(targetStreamUrl, {
      headers,
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const statusCode = upstreamRes.status || 200;
    res.status(statusCode);

    if (upstreamRes.headers['content-type']) {
      res.setHeader('Content-Type', String(upstreamRes.headers['content-type']));
    }
    if (upstreamRes.headers['content-length']) {
      res.setHeader('Content-Length', String(upstreamRes.headers['content-length']));
    }
    if (upstreamRes.headers['content-range']) {
      res.setHeader('Content-Range', String(upstreamRes.headers['content-range']));
    }

    upstreamRes.data.pipe(res);

    req.on('close', () => {
      upstreamRes.data.destroy();
    });
  } catch (err: any) {
    console.error('[Audio Proxy Error]:', err?.message || err);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: "Couldn't stream audio", code: 'STREAM_FAILED' });
    }
  }
};
