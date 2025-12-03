import { Router } from 'express';
import * as ConfigController from './config.controller';
const router = Router();
router.get('/', ConfigController.get);
router.put('/', ConfigController.update);
export default router;