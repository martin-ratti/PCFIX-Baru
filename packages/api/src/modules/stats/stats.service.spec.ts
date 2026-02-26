import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        producto: { count: vi.fn() },
        user: { count: vi.fn() },
        venta: { count: vi.fn(), findMany: vi.fn() },
        consultaTecnica: { count: vi.fn() },
        lineaVenta: { groupBy: vi.fn(), findFirst: vi.fn() },
        favorite: { findMany: vi.fn() },
        $transaction: vi.fn((arr: any[]) => Promise.all(arr))
    }
}));

import { StatsService } from './stats.service';

describe('StatsService - Full Coverage', () => {
    let service: StatsService;

    beforeEach(() => {
        service = new StatsService();
        vi.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should return all dashboard stats', async () => {
            (prisma.$transaction as any).mockResolvedValue([100, 5, 50, 30, 3]);
            const stats = await service.getDashboardStats();
            expect(stats).toEqual({
                totalProducts: 100,
                lowStockProducts: 5,
                totalUsers: 50,
                recentSales: 30,
                pendingInquiries: 3
            });
        });
    });

    describe('getSalesIntelligence', () => {
        it('should return KPIs, charts, and dead stock', async () => {
            (prisma.venta.findMany as any)
                .mockResolvedValueOnce([{ montoTotal: 50000 }, { montoTotal: 30000 }])
                .mockResolvedValueOnce([
                    { fecha: new Date(), montoTotal: 10000 }
                ]);

            (prisma.producto.count as any).mockResolvedValue(3);
            (prisma.venta.count as any).mockResolvedValue(2);
            (prisma.consultaTecnica.count as any).mockResolvedValue(1);

            (prisma.lineaVenta.groupBy as any).mockResolvedValue([
                { productoId: 1, _sum: { cantidad: 10 } }
            ]);
            (prisma as any).producto = {
                ...(prisma as any).producto,
                count: (prisma.producto.count as any),
                findUnique: vi.fn().mockResolvedValue({ nombre: 'GPU' }),
                findMany: vi.fn().mockResolvedValue([])
            };

            (prisma.lineaVenta.findFirst as any).mockResolvedValue(null);

            const result = await service.getSalesIntelligence();

            expect(result.kpis).toBeDefined();
            expect(result.kpis.grossRevenue).toBe(80000);
            expect(result.charts).toBeDefined();
            expect(result.charts.salesTrend).toHaveLength(30);
            expect(result.deadStock).toBeDefined();
        });

        it('should handle empty data', async () => {
            (prisma.venta.findMany as any).mockResolvedValue([]);
            (prisma.producto.count as any).mockResolvedValue(0);
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.consultaTecnica.count as any).mockResolvedValue(0);
            (prisma.lineaVenta.groupBy as any).mockResolvedValue([]);
            (prisma as any).producto.findMany = vi.fn().mockResolvedValue([]);

            const result = await service.getSalesIntelligence();

            expect(result.kpis.grossRevenue).toBe(0);
            expect(result.charts.topProducts).toHaveLength(0);
            expect(result.deadStock).toHaveLength(0);
        });

        it('should detect dead stock (>90 days inactive)', async () => {
            (prisma.venta.findMany as any).mockResolvedValue([]);
            (prisma.producto.count as any).mockResolvedValue(1);
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.consultaTecnica.count as any).mockResolvedValue(0);
            (prisma.lineaVenta.groupBy as any).mockResolvedValue([]);

            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 120);

            (prisma as any).producto.findMany = vi.fn().mockResolvedValue([
                { id: 1, nombre: 'Old Product', stock: 10, precio: 1000, createdAt: oldDate }
            ]);
            (prisma.lineaVenta.findFirst as any).mockResolvedValue(null);

            const result = await service.getSalesIntelligence();
            expect(result.deadStock).toHaveLength(1);
            expect(result.deadStock[0].name).toBe('Old Product');
            expect(result.deadStock[0].daysInactive).toBeGreaterThan(90);
        });
    });
});
