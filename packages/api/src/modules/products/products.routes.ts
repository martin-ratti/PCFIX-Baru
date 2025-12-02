import { Router } from 'express';
import * as ProductController from './products.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
router.post('/', upload.single('foto'), ProductController.create);
// La ruta DELETE sigue siendo la misma, el cambio es interno
router.delete('/:id', ProductController.remove);

export default router;