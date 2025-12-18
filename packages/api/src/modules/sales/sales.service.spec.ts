import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from './sales.service';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        venta: {
            findMany: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn()
        },
        producto: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn()
        },
        cliente: {
            findUnique: vi.fn(),
            create: vi.fn()
        },
        user: {
            findUnique: vi.fn(),
            create: vi.fn()
        },
        $transaction: vi.fn((arg) => {
            if (Array.isArray(arg)) return Promise.all(arg);
            return arg(prisma);
        })
    }
}));

vi.mock('../../shared/services/EmailService', () => ({
    EmailService: class {
        sendNewReceiptNotification = vi.fn();
        sendStatusUpdate = vi.fn();
        sendNewShipmentNotification = vi.fn();
    }
}));

vi.mock('../../shared/services/ShippingService', () => ({
    ShippingService: class {
        calculateCost = vi.fn();
        createShipment = vi.fn();
        getLabel = vi.fn();
    }
}));

describe('SalesService', () => {
    let service: SalesService;

    beforeEach(() => {
        service = new SalesService();
        vi.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return sales with pagination', async () => {
            (prisma.venta.count as any).mockResolvedValue(10);
            (prisma.venta.findMany as any).mockResolvedValue([{ id: 1 }]);

            const result = await service.findAll(1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(10);
            expect(prisma.venta.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 0,
                take: 10
            }));
        });

        it('should filter by month and year', async () => {
            (prisma.venta.count as any).mockResolvedValue(5);
            (prisma.venta.findMany as any).mockResolvedValue([]);

            await service.findAll(1, 10, undefined, 12, 2024);

            const expectedStartDate = new Date(2024, 11, 1);
            const expectedEndDate = new Date(2024, 12, 0, 23, 59, 59);

            expect(prisma.venta.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    fecha: {
                        gte: expectedStartDate,
                        lte: expectedEndDate
                    }
                })
            }));
        });

        it('should filter by specific date', async () => {
            (prisma.venta.count as any).mockResolvedValue(2);
            (prisma.venta.findMany as any).mockResolvedValue([]);

            await service.findAll(1, 10, undefined, undefined, undefined, undefined, '2025-12-09');

            const expectedStartDate = new Date(2025, 11, 9, 0, 0, 0);
            const expectedEndDate = new Date(2025, 11, 9, 23, 59, 59);

            expect(prisma.venta.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    fecha: {
                        gte: expectedStartDate,
                        lte: expectedEndDate
                    }
                })
            }));
        });
        describe('createManualSale', () => {
            it('should create sale with custom service item', async () => {
                const data = {
                    customerEmail: 'test@test.com',
                    items: [{ id: 1, quantity: 1, customPrice: 5000, customDescription: 'Custom Install' }],
                    medioPago: 'EFECTIVO',
                    estado: 'APROBADO'
                };

                vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, email: 'test@test.com' } as any);
                vi.mocked(prisma.cliente.findUnique).mockResolvedValue({ id: 1, userId: 1 } as any);
                vi.mocked(prisma.producto.findMany).mockResolvedValue([{
                    id: 1,
                    nombre: 'Service',
                    precio: 0,
                    stock: 99999
                }] as any);

                vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
                    const tx = {
                        venta: { create: vi.fn().mockResolvedValue({ id: 100 }) },
                        producto: { update: vi.fn() }
                    };
                    return await callback(tx as any);
                });

                await service.createManualSale(data as any);

                expect(prisma.$transaction).toHaveBeenCalled();
            });
        });
    });
});
