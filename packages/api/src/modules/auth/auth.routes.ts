import { Router } from 'express';
import * as AuthController from './auth.controller';
import { authenticate } from '../../shared/middlewares/authMiddleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.loginGoogle);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);


router.post('/change-password', authenticate, AuthController.changePassword);
router.delete('/profile', authenticate, AuthController.deleteProfile);

export default router;
