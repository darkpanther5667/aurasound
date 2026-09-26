import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const updateContactSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20, 'Max 20 characters').optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE')
});

export const updateContact = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parseResult = updateContactSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    const { email, phone } = parseResult.data;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });
      if (existing) {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists'
        });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {})
      },
      select: {
        id: true,
        email: true,
        phone: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Account contact info updated successfully',
      data: updated
    });
  } catch (err: any) {
    console.error('Update contact error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update account contact info'
    });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parseResult = changePasswordSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    const { currentPassword, newPassword } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Check existing password if user has real password set
    if (user.password_hash && !user.password_hash.startsWith('$2a$10$aurasound_guest') && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          error: 'Incorrect current password'
        });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }
};

export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parseResult = deleteAccountSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Please type "DELETE" to confirm account termination'
      });
      return;
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({
      success: true,
      message: 'Account successfully deleted'
    });
  } catch (err: any) {
    console.error('Delete account error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
};
