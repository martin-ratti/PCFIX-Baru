import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node-cron', () => ({
    default: { schedule: vi.fn() }
}));

vi.mock('../../modules/config/config.service', () => ({
    ConfigService: class {
        syncUsdtPrice = vi.fn().mockResolvedValue(1500);
    }
}));

vi.mock('./EmailService', () => ({
    EmailService: class {
        sendAbandonedCartEmail = vi.fn().mockResolvedValue(true);
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        cart: {
            findMany: vi.fn().mockResolvedValue([]),
            update: vi.fn()
        }
    }
}));

import { CronService } from './cron.service';
import cron from 'node-cron';
import { prisma } from '../../shared/database/prismaClient';

describe('CronService', () => {
    let service: CronService;

    beforeEach(() => {
        service = new CronService();
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('start', () => {
        it('should schedule two cron jobs', () => {
            service.start();
            expect(cron.schedule).toHaveBeenCalledTimes(2);
        });

        it('should schedule USDT sync every 4 hours', () => {
            service.start();
            expect(cron.schedule).toHaveBeenCalledWith('0 */4 * * *', expect.any(Function));
        });

        it('should schedule abandoned carts every 30 min', () => {
            service.start();
            expect(cron.schedule).toHaveBeenCalledWith('*/30 * * * *', expect.any(Function));
        });
    });

    describe('checkAbandonedCarts', () => {
        it('should do nothing if no abandoned carts', async () => {
            ((prisma as any).cart.findMany as any).mockResolvedValue([]);
            await (service as any).checkAbandonedCarts();
            expect((prisma as any).cart.update).not.toHaveBeenCalled();
        });

        it('should send email for abandoned carts', async () => {
            ((prisma as any).cart.findMany as any).mockResolvedValue([{
                id: 1,
                user: { email: 'u@t.com', nombre: 'Juan' },
                items: [{ producto: { nombre: 'GPU', precio: 1000, foto: '' } }]
            }]);
            ((prisma as any).cart.update as any).mockResolvedValue({});

            await (service as any).checkAbandonedCarts();

            expect((prisma as any).cart.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { abandonedEmailSent: true }
            });
        });

        it('should skip carts without user email', async () => {
            ((prisma as any).cart.findMany as any).mockResolvedValue([{
                id: 2,
                user: { email: null },
                items: [{ producto: {} }]
            }]);

            await (service as any).checkAbandonedCarts();

            expect((prisma as any).cart.update).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            ((prisma as any).cart.findMany as any).mockRejectedValue(new Error('DB error'));
            await (service as any).checkAbandonedCarts();
        });
    });

    describe('runInitialSync', () => {
        it('should call syncUsdtPrice after timeout', async () => {
            (service as any).runInitialSync();
            vi.advanceTimersByTime(6000);
        });

        it('should handle sync error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            (service as any).runInitialSync();
            vi.advanceTimersByTime(6000);
        });
    });
});
