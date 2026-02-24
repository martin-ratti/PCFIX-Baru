import { Router } from 'express';
import * as UsersController from './users.controller';

const router = Router();


router.get('/:id', UsersController.getProfile);
router.put('/:id', UsersController.updateProfile);

export default router;