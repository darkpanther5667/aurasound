import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);

export default router;
