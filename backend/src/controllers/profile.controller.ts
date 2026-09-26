import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty').max(60, 'Max 60 characters').optional(),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  bio: z.string().max(250, 'Max 250 characters').optional()
});

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        display_name: true,
        avatar_url: true,
        bio: true,
        created_at: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        displayName: user.display_name || 'Aura Resident',
        avatarUrl: user.avatar_url || '',
        bio: user.bio || '',
        createdAt: user.created_at
      }
    });
  } catch (err: any) {
    console.error('Get profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile'
    });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parseResult = updateProfileSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    const { displayName, avatarUrl, bio } = parseResult.data;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined ? { display_name: displayName } : {}),
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
        ...(bio !== undefined ? { bio } : {})
      },
      select: {
        id: true,
        email: true,
        phone: true,
        display_name: true,
        avatar_url: true,
        bio: true,
        created_at: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updated.id,
        email: updated.email,
        phone: updated.phone || '',
        displayName: updated.display_name || 'Aura Resident',
        avatarUrl: updated.avatar_url || '',
        bio: updated.bio || '',
        createdAt: updated.created_at
      }
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};
