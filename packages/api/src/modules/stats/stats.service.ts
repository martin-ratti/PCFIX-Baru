import { prisma } from '../../shared/database/prismaClient';

export class StatsService {
  async getDashboardStats() {
    const [totalProducts, lowStockProducts, totalUsers, recentSales, pendingInquiries] = await prisma.$transaction([
      // 1. Total Productos activos
      prisma.producto.count({ where: { deletedAt: null } }),
      
      // 2. Productos con stock bajo (< 5)
      prisma.producto.count({ where: { deletedAt: null, stock: { lte: 5 } } }),
      
      // 3. Total Usuarios
      prisma.user.count(),

      // 4. Ventas recientes (últimos 7 días, ejemplo simple o total histórico)
      prisma.venta.count(),

      // 5. NUEVO: Consultas Técnicas Pendientes
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