import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const DEFAULT_SETTINGS = {
  playback: {
    audioQuality: 'lossless-flac', // 'lossless-flac' | 'high-320' | 'standard-192' | 'data-saver'
    autoplay: true,
    defaultEqPreset: 'reference' // 'reference' | 'warm-analog' | 'club-sub' | 'vocal-air'
  },
  privacy: {
    showActivityToFriends: true,
    friendRequestScope: 'everyone' // 'everyone' | 'nobody'
  },
  notifications: {
    friendActivity: true,
    newFollowers: true,
    newReleases: true
  }
};

const updateSettingsSchema = z.object({
  playback: z
    .object({
      audioQuality: z.enum(['lossless-flac', 'high-320', 'standard-192', 'data-saver']).optional(),
      autoplay: z.boolean().optional(),
      defaultEqPreset: z.enum(['reference', 'warm-analog', 'club-sub', 'vocal-air']).optional()
    })
    .optional(),
  privacy: z
    .object({
      showActivityToFriends: z.boolean().optional(),
      friendRequestScope: z.enum(['everyone', 'nobody']).optional()
    })
    .optional(),
  notifications: z
    .object({
      friendActivity: z.boolean().optional(),
      newFollowers: z.boolean().optional(),
      newReleases: z.boolean().optional()
    })
    .optional()
});

export const getSettings = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });

    const storedSettings = (user?.settings as any) || {};

    const merged = {
      playback: { ...DEFAULT_SETTINGS.playback, ...(storedSettings.playback || {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(storedSettings.privacy || {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(storedSettings.notifications || {}) }
    };

    res.status(200).json({
      success: true,
      data: merged
    });
  } catch (err: any) {
    console.error('Get settings error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user settings'
    });
  }
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parseResult = updateSettingsSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });

    const current = (user?.settings as any) || {};
    const incoming = parseResult.data;

    const merged = {
      playback: {
        ...DEFAULT_SETTINGS.playback,
        ...(current.playback || {}),
        ...(incoming.playback || {})
      },
      privacy: {
        ...DEFAULT_SETTINGS.privacy,
        ...(current.privacy || {}),
        ...(incoming.privacy || {})
      },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(current.notifications || {}),
        ...(incoming.notifications || {})
      }
    };

    await prisma.user.update({
      where: { id: userId },
      data: { settings: merged }
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: merged
    });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to save settings'
    });
  }
};
