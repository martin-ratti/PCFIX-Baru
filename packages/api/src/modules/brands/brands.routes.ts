import { Router } from 'express';
import * as BrandController from './brands.controller';
import { upload } from '../../shared/middlewares/uploadMiddleware';

const router = Router();

router.get('/', BrandController.getAll);
router.post('/', upload.single('logo'), BrandController.create);
router.delete('/:id', BrandController.remove);

export default router;