import { prisma } from '../../shared/database/prismaClient';

export class StatsService {
  async getDashboardStats() {
    const [totalProducts, lowStockProducts, totalUsers, recentSales, pendingInquiries] = await prisma.$transaction([
      prisma.producto.count({ where: { deletedAt: null } }),


      prisma.producto.count({ where: { deletedAt: null, stock: { lte: 5 } } }),


      prisma.user.count(),


      prisma.venta.count(),


      prisma.consultaTecnica.count({ where: { estado: 'PENDIENTE' } })
    ]);

    return {
      totalProducts,
      lowStockProducts,
      totalUsers,
      recentSales,
      pendingInquiries
    };
  }
}