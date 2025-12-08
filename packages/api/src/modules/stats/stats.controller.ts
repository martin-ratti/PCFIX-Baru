import { Request, Response } from 'express';
import { StatsService } from './stats.service';

const statsService = new StatsService();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const data = await statsService.getDashboardStats();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
  }
};

export const getSalesIntelligence = async (req: Request, res: Response) => {
  try {
    const data = await statsService.getSalesIntelligence();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error obteniendo inteligencia de ventas' });
  }
};