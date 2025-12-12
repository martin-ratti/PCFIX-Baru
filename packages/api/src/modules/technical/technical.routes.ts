import { Router } from 'express';
import * as Controller from './technical.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';

const router = Router();

// --- Rutas de Precios de Servicios (Public + Admin) ---
router.get('/prices', Controller.getPrices); // Público
router.put('/prices/:id', authenticate, requireAdmin, Controller.updatePrice); // Admin

// --- Rutas de Consultas Técnicas (User + Admin) ---
router.post('/', authenticate, Controller.createInquiry); // Usuario crea
router.get('/me', authenticate, Controller.getMyInquiries); // Usuario ve suyas
router.get('/', authenticate, requireAdmin, Controller.getAllInquiries); // Admin ve todas
router.put('/:id/reply', authenticate, requireAdmin, Controller.replyInquiry); // Admin responde
router.delete('/:id', authenticate, requireAdmin, Controller.deleteInquiry); // Admin elimina

export default router;