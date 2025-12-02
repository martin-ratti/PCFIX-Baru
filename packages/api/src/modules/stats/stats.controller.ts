import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Ejecutamos varias consultas en paralelo para ser eficientes
    const [
      totalProducts,
      lowStockProducts,
      totalUsers,
      recentSales
    ] = await Promise.all([
      // 1. Total de productos activos
      prisma.producto.count({ where: { deletedAt: null } }),
      
      // 2. Productos con bajo stock (< 5)
      prisma.producto.count({ 
        where: { 
          deletedAt: null,
          stock: { lte: 5 } 
        } 
      }),

      // 3. Total de usuarios
      prisma.user.count(),

      // 4. Ventas recientes (mock o reales si tuviéramos datos)
      // Como aún no implementamos el checkout, esto devolverá 0
      prisma.venta.count()
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        totalUsers,
        recentSales
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
  }
};