import { Router } from 'express';
import * as UsersController from './users.controller';

const router = Router();
router.get('/', UsersController.getAll);

export default router;