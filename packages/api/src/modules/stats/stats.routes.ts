import { Router } from 'express';
import * as StatsController from './stats.controller';

const router = Router();

router.get('/', StatsController.getDashboardStats);

export default router;