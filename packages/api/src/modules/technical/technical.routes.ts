import { Router } from 'express';
import * as Controller from './technical.controller';
import { authenticate, requireAdmin } from '../../shared/middlewares/authMiddleware';

const router = Router();


router.get('/prices', Controller.getPrices); 
router.put('/prices/:id', authenticate, requireAdmin, Controller.updatePrice); 


router.post('/', authenticate, Controller.createInquiry); 
router.get('/me', authenticate, Controller.getMyInquiries); 
router.get('/', authenticate, requireAdmin, Controller.getAllInquiries); 
router.put('/:id/reply', authenticate, requireAdmin, Controller.replyInquiry); 
router.delete('/:id', authenticate, requireAdmin, Controller.deleteInquiry); 

export default router;