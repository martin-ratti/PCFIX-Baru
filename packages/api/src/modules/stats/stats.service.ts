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

  async getSalesIntelligence() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // 1. Gross Revenue & Ticket (Current Month)
    const currentMonthSales = await prisma.venta.findMany({
      where: {
        fecha: { gte: startOfMonth },
        estado: { notIn: ['CANCELADO', 'RECHAZADO', 'PENDIENTE_PAGO'] }
      },
      select: { montoTotal: true }
    });

    const grossRevenue = currentMonthSales.reduce((acc, sale) => acc + Number(sale.montoTotal), 0);


    // 2. Low Stock Products (Stock <= 5)
    // Replaced Average Ticket as per user request
    const lowStockProducts = await prisma.producto.count({
      where: { deletedAt: null, stock: { lte: 5 } }
    });

    // 3. Ventas Pendientes de Revisión (comprobante subido, sin aprobar)
    const pendingReview = await prisma.venta.count({
      where: { estado: 'PENDIENTE_APROBACION' }
    });

    // 4. Pending Technical Support Tickets
    // Replaced Retention Rate as per user request
    const pendingSupport = await prisma.consultaTecnica.count({
      where: { estado: 'PENDIENTE' }
    });

    // 4. Sales Trend (Last 30 Days)
    const salesLast30Days = await prisma.venta.findMany({
      where: {
        fecha: { gte: thirtyDaysAgo },
        estado: { notIn: ['CANCELADO', 'RECHAZADO', 'PENDIENTE_PAGO'] }
      },
      select: { fecha: true, montoTotal: true }
    });

    const salesTrendMap = new Map<string, { date: string, count: number, total: number }>();

    // Initialize last 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      salesTrendMap.set(key, { date: key, count: 0, total: 0 });
    }

    salesLast30Days.forEach(sale => {
      const key = sale.fecha.toISOString().split('T')[0];
      if (salesTrendMap.has(key)) {
        const entry = salesTrendMap.get(key)!;
        entry.count++;
        entry.total += Number(sale.montoTotal);
      }
    });

    const salesTrend = Array.from(salesTrendMap.values()).reverse();

    // 5. Top 5 Products (Last 30 Days)
    const topProductsRaw = await prisma.lineaVenta.groupBy({
      by: ['productoId'],
      where: {
        venta: {
          fecha: { gte: thirtyDaysAgo },
          estado: { notIn: ['CANCELADO', 'RECHAZADO', 'PENDIENTE_PAGO'] }
        }
      },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
      const product = await prisma.producto.findUnique({ where: { id: item.productoId }, select: { nombre: true } });
      return {
        name: product?.nombre || 'Unknown',
        quantity: item._sum.cantidad || 0
      };
    }));

    // 6. Dead Stock (> 90 days no sales)
    // Find products with stock > 0
    const deadStockCandidates = await prisma.producto.findMany({
      where: {
        deletedAt: null,
        stock: { gt: 0 }
      },
      select: { id: true, nombre: true, stock: true, precio: true, createdAt: true },
    });

    const deadStock = [];

    for (const product of deadStockCandidates) {
      const lastSale = await prisma.lineaVenta.findFirst({
        where: { productoId: product.id },
        orderBy: { venta: { fecha: 'desc' } },
        include: { venta: { select: { fecha: true } } }
      });

      const lastInteractionDate = lastSale?.venta?.fecha || product.createdAt; // If never sold, use creation date

      if (lastInteractionDate < ninetyDaysAgo) {
        deadStock.push({
          id: product.id,
          name: product.nombre,
          stock: product.stock,
          price: Number(product.precio),
          lastSale: lastSale?.venta?.fecha ? lastSale.venta.fecha : null,
          daysInactive: Math.floor((now.getTime() - lastInteractionDate.getTime()) / (1000 * 3600 * 24))
        });
      }
    }

    return {
      kpis: {
        grossRevenue,
        lowStockProducts,
        pendingReview,
        pendingSupport
      },
      charts: {
        salesTrend,
        topProducts
      },
      deadStock
    };
  }
}