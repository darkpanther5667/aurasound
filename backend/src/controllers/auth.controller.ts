import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aurasound-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

export const signup = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    const { email, password } = parseResult.data;
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash
      },
      select: {
        id: true,
        email: true,
        created_at: true
      }
    });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: newUser,
        token
      }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing registration'
    });
  }
};

export const login = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      });
      return;
    }

    const { email, password } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing authentication'
    });
  }
};
