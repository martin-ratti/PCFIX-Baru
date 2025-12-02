import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';

const router = Router();

// Endpoint: GET /api/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo categorías' });
  }
});

export default router;
