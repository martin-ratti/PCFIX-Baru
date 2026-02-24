import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CronService } from './cron.service';
import cron from 'node-cron';
import { ConfigService } from '../../modules/config/config.service';
import { EmailService } from './EmailService';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('node-cron');
vi.mock('../../modules/config/config.service');
vi.mock('./EmailService');

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        cart: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
    },
}));

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
        it('should schedule tasks', () => {
            service.start();
            expect(cron.schedule).toHaveBeenCalledTimes(2); 
        });
    });

    describe('checkAbandonedCarts', () => {
        it('should find and email abandoned carts', async () => {
            

            const carts = [
                { id: 1, user: { email: 'test@test.com', nombre: 'Test' }, items: [{ producto: { nombre: 'Prod' } }] }
            ];

            vi.mocked(prisma.cart.findMany).mockResolvedValue(carts as any);
            vi.spyOn(EmailService.prototype, 'sendAbandonedCartEmail').mockResolvedValue(true);

            
            
            
            
            await (service as any).checkAbandonedCarts();

            expect(prisma.cart.findMany).toHaveBeenCalled();
            expect(EmailService.prototype.sendAbandonedCartEmail).toHaveBeenCalled();
            expect(prisma.cart.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { abandonedEmailSent: true }
            });
        });
    });
});
