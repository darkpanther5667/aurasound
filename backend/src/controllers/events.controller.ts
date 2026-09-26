import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const eventSchema = z.object({
  trackId: z.string().uuid().optional().nullable(),
  eventType: z.enum(['play', 'skip', 'complete', 'like', 'unlike', 'search']),
  context: z.record(z.any()).optional().default({})
});

export const logEvent = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const parseResult = eventSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required to log user telemetry events'
      });
      return;
    }

    const { trackId, eventType, context } = parseResult.data;

    // Verify track existence if trackId supplied
    let validTrackId: string | null = null;
    if (trackId) {
      const trackExists = await prisma.track.findUnique({ where: { id: trackId } });
      if (trackExists) {
        validTrackId = trackExists.id;
      }
    }

    const newEvent = await prisma.event.create({
      data: {
        user_id: userId,
        track_id: validTrackId,
        event_type: eventType as any,
        context: context || {}
      }
    });

    res.status(201).json({
      success: true,
      message: 'Event logged successfully',
      data: {
        eventId: newEvent.id,
        eventType: newEvent.event_type,
        createdAt: newEvent.created_at
      }
    });
  } catch (err: any) {
    console.error('Log event error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record event'
    });
  }
};
