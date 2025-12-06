import { Router } from 'express';
import * as CategoryController from './categories.controller';

const router = Router();

// 1. Listar todas
router.get('/', CategoryController.getAll);

// 👇 2. Obtener una por ID (NUEVA RUTA)
router.get('/:id', CategoryController.getById);

// 3. Crear (Admin)
router.post('/', CategoryController.create);

// 4. Eliminar (Admin)
router.delete('/:id', CategoryController.remove);

export default router;