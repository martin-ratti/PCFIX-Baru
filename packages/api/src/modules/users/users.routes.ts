import { Router } from 'express';
import * as UsersController from './users.controller';

const router = Router();

// Rutas de Perfil individual
router.get('/:id', UsersController.getProfile);
router.put('/:id', UsersController.updateProfile);

export default router;