import { Router } from 'express';
import * as Controller from './sales.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';
import { upload, uploadReceipt } from '../../shared/middlewares/uploadMiddleware';

const router = Router();


router.get('/mp-callback', Controller.handleMPCallback);
router.post('/webhook', Controller.handleMPWebhook);
router.post('/quote', Controller.quoteShipping);


router.get('/balance', authenticate, requireAdmin, Controller.getBalance);
router.get('/my-sales', authenticate, Controller.getMySales);

router.post('/', authenticate, Controller.createSale);
router.get('/', authenticate, requireAdmin, Controller.getAllSales);

router.post('/manual', authenticate, requireAdmin, Controller.createManualSale);
router.get('/:id', authenticate, Controller.getSaleById);

router.post('/:id/receipt', authenticate, uploadReceipt.single('comprobante'), Controller.uploadReceipt);



router.put('/:id/payment-method', authenticate, Controller.updatePaymentMethod);
router.put('/:id/payment-method', authenticate, Controller.updatePaymentMethod);

router.post('/:id/mp-preference', authenticate, Controller.createMPPreference);
router.put('/:id/cancel', authenticate, Controller.cancelOrder);

router.put('/:id/status', authenticate, requireAdmin, Controller.updateStatus);
router.put('/:id/dispatch', authenticate, requireAdmin, Controller.dispatchSale);


router.post('/:id/create-shipment', authenticate, requireAdmin, Controller.createZipnovaShipment);
router.get('/:id/label', authenticate, Controller.getShipmentLabel);

export default router;