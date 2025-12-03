import { Router } from 'express';
import * as UsersController from './users.controller';

const router = Router();

// Existing route (List all users - Admin only)
router.get('/', UsersController.getAll);

// New profile routes
router.get('/:id', UsersController.getProfile);
router.put('/:id', UsersController.updateProfile);

export default router;