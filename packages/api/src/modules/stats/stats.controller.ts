import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Ejecutamos consultas en paralelo
    const [
      totalProducts,
      lowStockProducts,
      totalUsers,
      recentSales,
      pendingInquiries // 👇 NUEVO
    ] = await Promise.all([
      prisma.producto.count({ where: { deletedAt: null } }),
      
      prisma.producto.count({ where: { deletedAt: null, stock: { lte: 5 } } }),

      prisma.user.count(),

      prisma.venta.count(),

      // 👇 CONTAMOS LAS CONSULTAS PENDIENTES
      prisma.consultaTecnica.count({ where: { estado: 'PENDIENTE' } })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        totalUsers,
        recentSales,
        pendingInquiries // 👇 ENVIAMOS AL FRONT
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
  }
};