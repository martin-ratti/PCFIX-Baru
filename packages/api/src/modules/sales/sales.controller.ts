import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';

export const getAll = async (req: Request, res: Response) => {
  try {
    const sales = await prisma.venta.findMany({
      include: {
        cliente: { include: { user: true } }, // Traemos datos del cliente y usuario
        pagos: true
      },
      orderBy: { fecha: 'desc' }
    });
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo ventas' });
  }
};