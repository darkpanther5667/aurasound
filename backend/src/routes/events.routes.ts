import { Router } from 'express';
import { logEvent } from '../controllers/events.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Log telemetry event (play, skip, complete, like, search)
router.post('/', requireAuth, logEvent);

export default router;
