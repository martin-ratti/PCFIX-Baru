import { Router } from 'express';
import * as Controller from './sales.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';
import { upload } from '../../shared/middlewares/uploadMiddleware';

const router = Router();

// --- RUTAS PÚBLICAS O SEMI-PÚBLICAS ---
router.get('/mp-callback', Controller.handleMPCallback); // Must be before /:id
router.post('/quote', authenticate, Controller.quoteShipping);

// --- RUTAS AUTENTICADAS ---
router.get('/balance', authenticate, requireAdmin, Controller.getBalance);
router.get('/my-sales', authenticate, Controller.getMySales);

router.post('/', authenticate, Controller.createSale);
router.get('/', authenticate, requireAdmin, Controller.getAllSales);

router.post('/manual', authenticate, requireAdmin, Controller.createManualSale);
router.get('/:id', authenticate, Controller.getSaleById);

router.post('/:id/receipt', authenticate, upload.single('comprobante'), Controller.uploadReceipt);
// Webhook (Public)
// router.post('/webhook/viumi', Controller.handleViumiWebhook);

router.put('/:id/payment-method', authenticate, Controller.updatePaymentMethod);
router.put('/:id/payment-method', authenticate, Controller.updatePaymentMethod);
// router.post('/:id/viumi-preference', authenticate, Controller.createViumiPreference);
router.post('/:id/mp-preference', authenticate, Controller.createMPPreference);
router.put('/:id/cancel', authenticate, Controller.cancelOrder);

router.put('/:id/status', authenticate, requireAdmin, Controller.updateStatus);
router.put('/:id/dispatch', authenticate, requireAdmin, Controller.dispatchSale);

// Zipnova Integration
router.post('/:id/create-shipment', authenticate, requireAdmin, Controller.createZipnovaShipment);
router.get('/:id/label', authenticate, Controller.getShipmentLabel);

export default router;