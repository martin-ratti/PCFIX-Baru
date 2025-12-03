import { Router } from 'express';
import * as Controller from './sales.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware';
import { authenticate } from '../../shared/middlewares/authMiddleware'; // Importar middleware

const router = Router();

// Rutas protegidas
router.post('/', authenticate, Controller.create); // Crear orden (Requiere token)
router.get('/my-sales', authenticate, Controller.getMySales); // Mis compras (Requiere token)

// Otras rutas
router.get('/', Controller.getAll); // Admin (debería tener requireAdmin, pero lo dejamos así por ahora)
router.get('/:id', Controller.getById); 
router.post('/:id/comprobante', upload.single('comprobante'), Controller.uploadReceipt); 
router.put('/:id/status', Controller.updateStatus); 

export default router;