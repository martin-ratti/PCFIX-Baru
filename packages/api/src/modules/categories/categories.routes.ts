import { Router } from 'express';
import * as CategoryController from './categories.controller';

const router = Router();

router.get('/', CategoryController.getAll);
router.post('/', CategoryController.create);
router.delete('/:id', CategoryController.remove);

export default router;