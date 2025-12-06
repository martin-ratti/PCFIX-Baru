import { Router } from 'express';
import * as FavoritesController from './favorites.controller';

const router = Router();

router.get('/:userId', FavoritesController.getByUserId);

router.post('/toggle', FavoritesController.toggleFavorite);

export default router;