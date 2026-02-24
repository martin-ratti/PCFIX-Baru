import { Router } from 'express';
import * as Controller from './config.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';

const router = Router();


router.get('/', Controller.getConfig);
router.put('/', authenticate, requireAdmin, Controller.updateConfig);


router.post('/sync-usdt', authenticate, requireAdmin, Controller.syncUsdt);


router.post('/contact', Controller.sendContactEmail);

export default router;