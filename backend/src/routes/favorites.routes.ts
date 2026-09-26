import { Router } from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite
} from '../controllers/favorites.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:trackId', removeFavorite);

export default router;
