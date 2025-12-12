import { Router } from 'express';
import * as ProductController from './products.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware';

import { subscribeToStockAlert } from './stock-alert.controller';

const router = Router();

// Rutas Públicas
router.get('/', ProductController.getAll);
router.get('/best-sellers', ProductController.getBestSellers);
router.get('/:id', ProductController.getById);

router.post('/alert/subscribe', subscribeToStockAlert);

// Rutas Admin (Protegidas por middleware en el server o aquí)
router.post('/', upload.single('foto'), ProductController.create);
router.put('/:id', upload.single('foto'), ProductController.update);
router.delete('/:id', ProductController.remove);

export default router;