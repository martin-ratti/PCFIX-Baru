// packages/api/src/modules/products/products.routes.ts
import { Router } from 'express';
import * as ProductController from './products.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware'; // Importar

const router = Router();

router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);

// AHORA USAMOS EL MIDDLEWARE AQUÍ
router.post('/', upload.single('foto'), ProductController.create);

export default router;