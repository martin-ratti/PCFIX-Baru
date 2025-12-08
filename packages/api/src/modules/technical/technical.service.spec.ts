import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn()
    },
    consultaTecnica: {
        create: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn()
    },
    serviceItem: {
        findMany: vi.fn(),
        update: vi.fn()
    },
    producto: {
        findFirst: vi.fn(),
        update: vi.fn()
    },
    $transaction: vi.fn()
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

vi.mock('../../shared/services/EmailService', () => ({
    EmailService: class {
        sendNewInquiryNotification = vi.fn().mockResolvedValue(undefined);
        sendReplyNotification = vi.fn().mockResolvedValue(undefined);
    }
}));

import { TechnicalService } from './technical.service';

describe('TechnicalService', () => {
    let service: TechnicalService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TechnicalService();
    });

    describe('createInquiry', () => {
        it('should create an inquiry and send email', async () => {
            const mockUser = { id: 1, email: 'test@test.com', nombre: 'Test User' };
            const mockInquiry = { id: 1, userId: 1, asunto: 'Test', mensaje: 'Message', estado: 'PENDIENTE' };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.consultaTecnica.create.mockResolvedValue(mockInquiry);

            const result = await service.createInquiry(1, 'Test', 'Message');

            expect(result).toEqual(mockInquiry);
            expect(mockPrisma.consultaTecnica.create).toHaveBeenCalledWith({
                data: { userId: 1, asunto: 'Test', mensaje: 'Message', estado: 'PENDIENTE' }
            });
        });

        it('should throw error if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.createInquiry(1, 'Test', 'Message')).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('findAllInquiries', () => {
        it('should return paginated inquiries', async () => {
            const mockItems = [{ id: 1, asunto: 'Test' }];
            mockPrisma.$transaction.mockResolvedValue([10, mockItems]);

            const result = await service.findAllInquiries(1, 10);

            expect(result.data).toEqual(mockItems);
            expect(result.meta.total).toBe(10);
            expect(result.meta.page).toBe(1);
        });
    });

    describe('findInquiriesByUserId', () => {
        it('should return inquiries for user', async () => {
            const mockInquiries = [{ id: 1, userId: 1, asunto: 'Test' }];
            mockPrisma.consultaTecnica.findMany.mockResolvedValue(mockInquiries);

            const result = await service.findInquiriesByUserId(1);

            expect(result).toEqual(mockInquiries);
            expect(mockPrisma.consultaTecnica.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                orderBy: { createdAt: 'desc' }
            });
        });
    });

    describe('replyInquiry', () => {
        it('should update inquiry with reply and send email', async () => {
            const mockConsulta = {
                id: 1,
                asunto: 'Test',
                respuesta: 'Reply',
                estado: 'RESPONDIDO',
                user: { email: 'test@test.com' }
            };
            mockPrisma.consultaTecnica.update.mockResolvedValue(mockConsulta);

            const result = await service.replyInquiry(1, 'Reply');

            expect(result).toEqual(mockConsulta);
            expect(mockPrisma.consultaTecnica.update).toHaveBeenCalled();
        });
    });

    describe('getServicePrices', () => {
        it('should return active service items', async () => {
            const mockItems = [{ id: 1, title: 'Service 1', price: 1000, active: true }];
            mockPrisma.serviceItem.findMany.mockResolvedValue(mockItems);

            const result = await service.getServicePrices();

            expect(result).toEqual(mockItems);
            expect(mockPrisma.serviceItem.findMany).toHaveBeenCalledWith({
                where: { active: true },
                orderBy: { id: 'asc' }
            });
        });
    });

    describe('updateServicePrice', () => {
        it('should update service price and sync with product', async () => {
            const mockServiceItem = { id: 1, title: 'Repair', price: 2000 };
            const mockProduct = { id: 100, nombre: 'Servicio: Repair', precio: 1500 };

            mockPrisma.serviceItem.update.mockResolvedValue(mockServiceItem);
            mockPrisma.producto.findFirst.mockResolvedValue(mockProduct);
            mockPrisma.producto.update.mockResolvedValue({ ...mockProduct, precio: 2000 });

            const result = await service.updateServicePrice(1, 2000);

            expect(result).toEqual(mockServiceItem);
            expect(mockPrisma.producto.update).toHaveBeenCalledWith({
                where: { id: 100 },
                data: { precio: 2000 }
            });
        });

        it('should not update product if not found', async () => {
            const mockServiceItem = { id: 1, title: 'New Service', price: 3000 };

            mockPrisma.serviceItem.update.mockResolvedValue(mockServiceItem);
            mockPrisma.producto.findFirst.mockResolvedValue(null);

            const result = await service.updateServicePrice(1, 3000);

            expect(result).toEqual(mockServiceItem);
            expect(mockPrisma.producto.update).not.toHaveBeenCalled();
        });
    });
});
