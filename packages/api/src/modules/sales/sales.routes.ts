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
router.post('/manual', authenticate, requireAdmin, Controller.createManualSale);
router.get('/:id', authenticate, Controller.getSaleById);

// Cliente (Acciones sobre su propia orden)
router.post('/:id/receipt', authenticate, upload.single('comprobante'), Controller.uploadReceipt);
router.put('/:id/payment-method', authenticate, Controller.updatePaymentMethod); // Cambiar método
router.put('/:id/cancel', authenticate, Controller.cancelOrder); // Cancelar

// Admin (Acciones de gestión)
router.put('/:id/status', authenticate, requireAdmin, Controller.updateStatus);
router.put('/:id/dispatch', authenticate, requireAdmin, Controller.dispatchSale);

export default router;