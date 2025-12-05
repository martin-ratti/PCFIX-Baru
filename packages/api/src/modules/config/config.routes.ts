import { Router } from 'express';
import * as Controller from './config.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';

const router = Router();

// Rutas existentes
router.get('/', Controller.getConfig); // Pública (para el checkout)
router.put('/', authenticate, requireAdmin, Controller.updateConfig);

// 👇 NUEVA RUTA: Trigger de actualización
router.post('/sync-usdt', authenticate, requireAdmin, Controller.syncUsdt);

export default router;