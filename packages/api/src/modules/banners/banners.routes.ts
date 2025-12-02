import { Router } from 'express';
import * as BannerController from './banners.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware';

const router = Router();

router.get('/', BannerController.getAll);
// Usamos el middleware 'upload' para procesar la imagen 'imagen'
router.post('/', upload.single('imagen'), BannerController.create);
router.delete('/:id', BannerController.remove);

export default router;