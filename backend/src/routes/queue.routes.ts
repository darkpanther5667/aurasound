import { Router } from 'express';
import {
  getQueue,
  updateQueue,
  removeQueueItem,
  clearQueue
} from '../controllers/queue.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getQueue);
router.put('/', updateQueue);
router.delete('/', clearQueue);
router.delete('/:trackId', removeQueueItem);

export default router;
