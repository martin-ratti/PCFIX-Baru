import { Router } from 'express';
import { syncCart, getCart } from './cart.controller';

const router = Router();

router.post('/sync', syncCart);
router.get('/:userId', getCart);

export default router;
