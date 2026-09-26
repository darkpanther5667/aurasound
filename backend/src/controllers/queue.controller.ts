import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const updateQueueSchema = z.object({
  trackIds: z.array(z.string()).max(150, { message: 'Queue cannot exceed 150 items' }).optional(),
  tracks: z
    .array(
      z.object({
        id: z.string().optional(),
        source: z.enum(['audius', 'youtube']).optional(),
        externalId: z.string().optional(),
        title: z.string().optional(),
        artist: z.string().optional(),
        coverUrl: z.string().optional(),
        durationSeconds: z.number().optional()
      })
    )
    .max(150)
    .optional()
});

export const getQueue = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const queueItems = await prisma.queueItem.findMany({
      where: { user_id: userId },
      orderBy: { position: 'asc' },
      include: {
        track: true
      }
    });

    const formatted = queueItems.map((item) => ({
      queueItemId: item.id,
      position: item.position,
      addedAt: item.added_at,
      track: {
        id: item.track.id,
        source: item.track.source,
        externalId: item.track.external_id,
        title: item.track.title,
        artist: item.track.artist,
        coverUrl: item.track.cover_url,
        durationSeconds: item.track.duration_seconds
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        total: formatted.length,
        queue: formatted
      }
    });
  } catch (err: any) {
    console.error('Get queue error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user queue'
    });
  }
};

export const updateQueue = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parseResult = updateQueueSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    let finalTrackIds: string[] = [];

    if (parseResult.data.tracks && parseResult.data.tracks.length > 0) {
      for (const t of parseResult.data.tracks) {
        if (t.id && !t.id.startsWith('temp-') && !t.id.startsWith('mock-')) {
          const existing = await prisma.track.findUnique({ where: { id: t.id } });
          if (existing) {
            finalTrackIds.push(existing.id);
            continue;
          }
        }
        if (t.externalId && t.source) {
          const upserted = await prisma.track.upsert({
            where: {
              source_external_id: {
                source: t.source,
                external_id: t.externalId
              }
            },
            update: {
              title: t.title || 'Untitled Track',
              artist: t.artist || 'Unknown Artist',
              cover_url: t.coverUrl || '',
              duration_seconds: t.durationSeconds || 180
            },
            create: {
              source: t.source,
              external_id: t.externalId,
              title: t.title || 'Untitled Track',
              artist: t.artist || 'Unknown Artist',
              cover_url: t.coverUrl || '',
              duration_seconds: t.durationSeconds || 180
            }
          });
          finalTrackIds.push(upserted.id);
        } else if (t.id) {
          finalTrackIds.push(t.id);
        }
      }
    } else if (parseResult.data.trackIds) {
      finalTrackIds = parseResult.data.trackIds;
    }

    // Clear existing queue and replace with ordered positions
    await prisma.$transaction(async (tx) => {
      await tx.queueItem.deleteMany({
        where: { user_id: userId }
      });

      if (finalTrackIds.length === 0) return;

      const existingTracks = await tx.track.findMany({
        where: { id: { in: finalTrackIds } },
        select: { id: true }
      });
      const validTrackIdSet = new Set(existingTracks.map((t) => t.id));

      const newItems = finalTrackIds
        .filter((id) => validTrackIdSet.has(id))
        .map((trackId, idx) => ({
          user_id: userId,
          track_id: trackId,
          position: idx
        }));

      if (newItems.length > 0) {
        await tx.queueItem.createMany({
          data: newItems
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Queue successfully updated',
      data: {
        itemCount: finalTrackIds.length
      }
    });
  } catch (err: any) {
    console.error('Update queue error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update queue'
    });
  }
};

export const removeQueueItem = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const trackId = req.params.trackId;

    if (!trackId) {
      res.status(400).json({
        success: false,
        error: 'trackId is required'
      });
      return;
    }

    await prisma.queueItem.deleteMany({
      where: {
        user_id: userId,
        track_id: trackId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Track removed from queue'
    });
  } catch (err: any) {
    console.error('Remove queue item error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to remove track from queue'
    });
  }
};

export const clearQueue = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.queueItem.deleteMany({
      where: { user_id: userId }
    });

    res.status(200).json({
      success: true,
      message: 'Queue successfully cleared'
    });
  } catch (err: any) {
    console.error('Clear queue error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to clear queue'
    });
  }
};
