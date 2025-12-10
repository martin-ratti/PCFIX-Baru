import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as StatsController from './stats.controller';
import { StatsService } from './stats.service';

vi.mock('./stats.service');

describe('StatsController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any;
    let status: any;

    beforeEach(() => {
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        req = {};
        res = {
            json,
            status,
        };
        vi.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should return dashboard stats', async () => {
            const stats = { totalSales: 100 };
            vi.spyOn(StatsService.prototype, 'getDashboardStats').mockResolvedValue(stats as any);

            await StatsController.getDashboardStats(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
        });

        it('should handle errors', async () => {
            vi.spyOn(StatsService.prototype, 'getDashboardStats').mockRejectedValue(new Error('Error'));

            await StatsController.getDashboardStats(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Error obteniendo estadísticas' });
        });
    });

    describe('getSalesIntelligence', () => {
        it('should return sales intelligence', async () => {
            const data = { revenue: [] };
            vi.spyOn(StatsService.prototype, 'getSalesIntelligence').mockResolvedValue(data as any);

            await StatsController.getSalesIntelligence(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data });
        });

        it('should handle errors', async () => {
            vi.spyOn(StatsService.prototype, 'getSalesIntelligence').mockRejectedValue(new Error('Error'));

            await StatsController.getSalesIntelligence(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Error obteniendo inteligencia de ventas' });
        });
    });
});
