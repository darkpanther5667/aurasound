import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const addFavoriteSchema = z.object({
  trackId: z.string().optional(),
  // Or auto-upsert an external track:
  externalId: z.string().optional(),
  source: z.enum(['audius', 'youtube']).optional(),
  title: z.string().optional(),
  artist: z.string().optional(),
  coverUrl: z.string().optional(),
  durationSeconds: z.number().optional()
});

export const getFavorites = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const favorites = await prisma.favorite.findMany({
      where: { user_id: userId },
      include: {
        track: true
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = favorites.map((f) => ({
      id: f.track.id,
      source: f.track.source,
      externalId: f.track.external_id,
      title: f.track.title,
      artist: f.track.artist,
      coverUrl: f.track.cover_url,
      durationSeconds: f.track.duration_seconds,
      favoritedAt: f.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        total: formatted.length,
        favorites: formatted
      }
    });
  } catch (err: any) {
    console.error('Get favorites error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve favorites'
    });
  }
};

export const addFavorite = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body = addFavoriteSchema.safeParse(req.body);

    if (!body.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid favorite payload'
      });
      return;
    }

    let trackId = body.data.trackId;

    // If externalId supplied, ensure track exists in database
    if (!trackId && body.data.externalId && body.data.source) {
      const track = await prisma.track.upsert({
        where: {
          source_external_id: {
            source: body.data.source,
            external_id: body.data.externalId
          }
        },
        update: {},
        create: {
          source: body.data.source,
          external_id: body.data.externalId,
          title: body.data.title || 'Untitled Track',
          artist: body.data.artist || 'Unknown Artist',
          cover_url: body.data.coverUrl || '',
          duration_seconds: body.data.durationSeconds || 180
        }
      });
      trackId = track.id;
    }

    if (!trackId) {
      res.status(400).json({
        success: false,
        error: 'trackId or external track metadata is required'
      });
      return;
    }

    // Add to favorites
    const fav = await prisma.favorite.upsert({
      where: {
        user_id_track_id: {
          user_id: userId,
          track_id: trackId
        }
      },
      update: {},
      create: {
        user_id: userId,
        track_id: trackId
      },
      include: {
        track: true
      }
    });

    // Also auto-log a "like" event
    await prisma.event.create({
      data: {
        user_id: userId,
        track_id: trackId,
        event_type: 'like'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Track added to favorites',
      data: {
        trackId: fav.track_id,
        createdAt: fav.created_at,
        track: fav.track
      }
    });
  } catch (err: any) {
    console.error('Add favorite error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to add track to favorites'
    });
  }
};

export const removeFavorite = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const trackId = req.params.trackId;

    if (!trackId) {
      res.status(400).json({
        success: false,
        error: 'trackId parameter required'
      });
      return;
    }

    await prisma.favorite.deleteMany({
      where: {
        user_id: userId,
        track_id: trackId
      }
    });

    // Also log "unlike" event
    await prisma.event.create({
      data: {
        user_id: userId,
        track_id: trackId,
        event_type: 'unlike'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Track removed from favorites'
    });
  } catch (err: any) {
    console.error('Remove favorite error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to remove track from favorites'
    });
  }
};
