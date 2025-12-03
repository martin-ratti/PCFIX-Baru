import { Request, Response } from 'express';
import { SalesService } from './sales.service';

const salesService = new SalesService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await salesService.findAll(page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo ventas' });
  }
};