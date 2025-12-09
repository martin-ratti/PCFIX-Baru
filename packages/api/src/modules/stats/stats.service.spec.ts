import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    $transaction: vi.fn(),
    producto: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    user: { count: vi.fn() },
    venta: { count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    consultaTecnica: { count: vi.fn() },
    lineaVenta: { groupBy: vi.fn(), findFirst: vi.fn() }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

import { StatsService } from './stats.service';

describe('StatsService', () => {
    let service: StatsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new StatsService();
        // Reset default implementations
        mockPrisma.venta.findMany.mockResolvedValue([]);
        mockPrisma.producto.findMany.mockResolvedValue([]);
        mockPrisma.venta.groupBy.mockResolvedValue([]);
        mockPrisma.lineaVenta.groupBy.mockResolvedValue([]);
    });

    describe('getDashboardStats', () => {
        it('should return all dashboard statistics', async () => {
            mockPrisma.$transaction.mockResolvedValue([100, 5, 50, 200, 10]);

            const result = await service.getDashboardStats();

            expect(mockPrisma.$transaction).toHaveBeenCalled();
            expect(result).toEqual({
                totalProducts: 100,
                lowStockProducts: 5,
                totalUsers: 50,
                recentSales: 200,
                pendingInquiries: 10
            });
        });

        it('should return zeros when no data exists', async () => {
            mockPrisma.$transaction.mockResolvedValue([0, 0, 0, 0, 0]);

            const result = await service.getDashboardStats();

            expect(result).toEqual({
                totalProducts: 0,
                lowStockProducts: 0,
                totalUsers: 0,
                recentSales: 0,
                pendingInquiries: 0
            });
        });
    });

    describe('getSalesIntelligence', () => {
        it('should calculate KPIs accurately', async () => {
            // Mock Date to ensure deterministic tests if logic depends on "now"
            // (Wait, service uses new Date inside. We can't easily mock system time without layout change or vitest timers)
            // For now we assume calculations are consistent.

            // 1. Gross Revenue & Ticket (2 sales of 1000 and 2000)
            mockPrisma.venta.findMany.mockResolvedValueOnce([
                { montoTotal: 1000, fecha: new Date() },
                { montoTotal: 2000, fecha: new Date() }
            ]);

            // 2. Low Stock (should return logic based on count)
            mockPrisma.producto.count.mockResolvedValueOnce(15);

            // 3. Pending Review (ventas con comprobante)
            mockPrisma.venta.count.mockResolvedValueOnce(2);

            // 4. Pending Support
            mockPrisma.consultaTecnica.count.mockResolvedValueOnce(3);

            // 4. Sales Trend (return empty or mocked for simplicity, focusing on known return structure)
            mockPrisma.venta.findMany.mockResolvedValueOnce([]); // Sales last 30 days

            // 5. Top Products
            mockPrisma.lineaVenta.groupBy.mockResolvedValueOnce([
                { productoId: 101, _sum: { cantidad: 50 } }
            ]);
            mockPrisma.producto.findUnique.mockResolvedValue({ nombre: 'Top Product' });

            // 6. Dead Stock
            mockPrisma.producto.findMany.mockResolvedValueOnce([]); // No dead stock candidates for this test

            const result = await service.getSalesIntelligence();

            expect(result.kpis.grossRevenue).toBe(3000); // 1000 + 2000
            expect(result.kpis.lowStockProducts).toBe(15);
            expect(result.kpis.pendingReview).toBe(2); // ventas pendientes de revisión
            expect(result.kpis.pendingSupport).toBe(3);

            // Top Products Check
            expect(result.charts.topProducts).toEqual([
                { name: 'Top Product', quantity: 50 }
            ]);
        });
    });
});
