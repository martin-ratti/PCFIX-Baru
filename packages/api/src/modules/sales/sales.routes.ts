import { Router } from 'express';
import * as Controller from './sales.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';
import { upload } from '../../shared/middlewares/uploadMiddleware';

const router = Router();

// --- RUTAS PÚBLICAS O SEMI-PÚBLICAS ---
// Endpoint para cotizar (necesario para el carrito)
router.post('/quote', authenticate, Controller.quoteShipping); 

// --- RUTAS AUTENTICADAS ---
router.get('/balance', authenticate, requireAdmin, Controller.getBalance);
router.get('/my-sales', authenticate, Controller.getMySales);

router.post('/', authenticate, Controller.createSale);
router.get('/', authenticate, requireAdmin, Controller.getAllSales);

router.post('/manual', authenticate, requireAdmin, Controller.createManualSale);
router.get('/:id', authenticate, Controller.getSaleById);

router.post('/:id/receipt', authenticate, upload.single('comprobante'), Controller.uploadReceipt);
router.put('/:id/payment-method', authenticate, Controller.updatePaymentMethod);
router.put('/:id/cancel', authenticate, Controller.cancelOrder);

router.put('/:id/status', authenticate, requireAdmin, Controller.updateStatus);
router.put('/:id/dispatch', authenticate, requireAdmin, Controller.dispatchSale);

export default router;