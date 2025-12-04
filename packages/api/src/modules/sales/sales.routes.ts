import { Router } from 'express';
import * as Controller from './sales.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';
import { upload } from '../../shared/middlewares/uploadMiddleware';

const router = Router();

// --- RUTAS ESPECÍFICAS (Antes de /:id) ---
router.get('/balance', authenticate, requireAdmin, Controller.getBalance);
router.get('/my-sales', authenticate, Controller.getMySales);

// --- RUTAS GENERALES ---
router.post('/', authenticate, Controller.createSale);
router.get('/', authenticate, requireAdmin, Controller.getAllSales);

// --- RUTAS CON ID ---
router.post('/:id/receipt', authenticate, upload.single('comprobante'), Controller.uploadReceipt);
router.put('/:id/status', authenticate, requireAdmin, Controller.updateStatus);
router.put('/:id/dispatch', authenticate, requireAdmin, Controller.dispatchSale);
router.get('/:id', authenticate, Controller.getSaleById);

export default router;