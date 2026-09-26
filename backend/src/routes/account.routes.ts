import { Router } from 'express';
import { updateContact, changePassword, deleteAccount } from '../controllers/account.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.put('/contact', updateContact);
router.put('/password', changePassword);
router.delete('/', deleteAccount);

export default router;
