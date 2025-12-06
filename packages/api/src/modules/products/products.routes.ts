import { Router } from 'express';
import * as ProductController from './products.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware';

const router = Router();

// Rutas Públicas
router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);

// Rutas Admin (Protegidas por middleware en el server o aquí)
router.post('/', upload.single('foto'), ProductController.create);
router.put('/:id', upload.single('foto'), ProductController.update); 
router.delete('/:id', ProductController.remove);

export default router;