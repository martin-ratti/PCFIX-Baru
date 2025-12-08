import { Router } from 'express';
import * as StatsController from './stats.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';

const router = Router();

router.get('/intelligence', authenticate, requireAdmin, StatsController.getSalesIntelligence);
router.get('/', authenticate, requireAdmin, StatsController.getDashboardStats);

export default router;