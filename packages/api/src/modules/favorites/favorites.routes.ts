import { Router } from 'express';
import * as FavoritesController from './favorites.controller';

const router = Router();

// Endpoint para obtener la lista de favoritos de un usuario
router.get('/:userId', FavoritesController.getByUserId);

// Endpoint para agregar/eliminar un producto de favoritos
router.post('/toggle', FavoritesController.toggleFavorite);

export default router;