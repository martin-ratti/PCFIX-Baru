import { Router } from 'express';
import * as Controller from './sales.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware';
import { authenticate } from '../../shared/middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, Controller.create);
router.get('/my-sales', authenticate, Controller.getMySales);
router.get('/', Controller.getAll);
router.get('/:id', Controller.getById);
router.post('/:id/comprobante', upload.single('comprobante'), Controller.uploadReceipt);
router.put('/:id/status', Controller.updateStatus);
router.put('/:id/dispatch', Controller.dispatch); // Idealmente proteger con admin middleware

export default router;