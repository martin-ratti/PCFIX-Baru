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
            
            
            

            
            mockPrisma.venta.findMany.mockResolvedValueOnce([
                { montoTotal: 1000, fecha: new Date() },
                { montoTotal: 2000, fecha: new Date() }
            ]);

            
            mockPrisma.producto.count.mockResolvedValueOnce(15);

            
            mockPrisma.venta.count.mockResolvedValueOnce(2);

            
            mockPrisma.consultaTecnica.count.mockResolvedValueOnce(3);

            
            mockPrisma.venta.findMany.mockResolvedValueOnce([]); 

            
            mockPrisma.lineaVenta.groupBy.mockResolvedValueOnce([
                { productoId: 101, _sum: { cantidad: 50 } }
            ]);
            mockPrisma.producto.findUnique.mockResolvedValue({ nombre: 'Top Product' });

            
            mockPrisma.producto.findMany.mockResolvedValueOnce([]); 

            const result = await service.getSalesIntelligence();

            expect(result.kpis.grossRevenue).toBe(3000); 
            expect(result.kpis.lowStockProducts).toBe(15);
            expect(result.kpis.pendingReview).toBe(2); 
            expect(result.kpis.pendingSupport).toBe(3);

            
            expect(result.charts.topProducts).toEqual([
                { name: 'Top Product', quantity: 50 }
            ]);
        });
    });
});
