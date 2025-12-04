import { Router } from 'express';
import * as Controller from './technical.controller';
import { authenticate } from '../../shared/middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, Controller.create);
router.get('/', authenticate, Controller.getAll); // Admin
router.get('/me', authenticate, Controller.getMyInquiries); // 👈 NUEVA RUTA (Usuario)
router.put('/:id/reply', authenticate, Controller.reply);

export default router;