import { Router } from 'express';
import * as SalesController from './sales.controller';

const router = Router();
router.get('/', SalesController.getAll);

export default router;