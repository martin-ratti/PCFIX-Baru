import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    $transaction: vi.fn(),
    producto: { count: vi.fn() },
    user: { count: vi.fn() },
    venta: { count: vi.fn() },
    consultaTecnica: { count: vi.fn() }
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
});
