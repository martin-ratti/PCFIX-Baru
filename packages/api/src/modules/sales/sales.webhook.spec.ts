import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from './sales.service';
import { prisma } from '../../shared/database/prismaClient';
import { VentaEstado } from '@prisma/client';

// Mock dependencies
vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        venta: {
            findUnique: vi.fn(),
            update: vi.fn()
        },
        producto: {
            findMany: vi.fn(),
            update: vi.fn()
        },
        cliente: {
            findUnique: vi.fn(),
            create: vi.fn()
        },
        lineaVenta: {
            update: vi.fn()
        },
        $transaction: vi.fn((arg) => {
            // Handle both callback and array patterns
            if (typeof arg === 'function') {
                return arg(prisma);
            }
            // For array of promises, resolve them all and return last element
            return Promise.all(arg).then(results => results);
        })
    }
}));

// Mock dependencies using vi.hoisted
const mocks = vi.hoisted(() => ({
    sendStatusUpdate: vi.fn().mockResolvedValue(true),
    sendNewReceiptNotification: vi.fn().mockResolvedValue(true),
    getPayment: vi.fn()
}));

vi.mock('../../shared/services/EmailService', () => ({
    EmailService: class {
        async sendStatusUpdate(...args: any[]) { return mocks.sendStatusUpdate(...args); }
        async sendNewReceiptNotification(...args: any[]) { return mocks.sendNewReceiptNotification(...args); }
    }
}));

vi.mock('../../shared/services/MercadoPagoService', () => ({
    MercadoPagoService: class {
        async getPayment(...args: any[]) { return mocks.getPayment(...args); }
    }
}));

describe('SalesService Webhook', () => {
    let service: SalesService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new SalesService();
    });

    it('should process approved payment and update sale status', async () => {
        const paymentId = '12345';
        const saleId = 100;

        // Mock MP response
        mocks.getPayment.mockResolvedValue({
            status: 'approved',
            external_reference: String(saleId)
        });

        // Mock Prisma responses
        const mockSale = {
            id: saleId,
            estado: VentaEstado.PENDIENTE_PAGO,
            cliente: { user: { email: 'test@test.com' } },
            tipoEntrega: 'ENVIO',
            costoEnvio: 1000,
            lineasVenta: [
                {
                    id: 1,
                    cantidad: 2,
                    subTotal: 10000,
                    producto: { id: 1, precio: 5000 }
                }
            ]
        };

        vi.mocked(prisma.venta.findUnique).mockResolvedValue(mockSale as any);
        vi.mocked(prisma.venta.update).mockResolvedValue({ ...mockSale, estado: VentaEstado.APROBADO } as any);

        await service.processMPWebhook(paymentId);

        // Verify MP service was called
        expect(mocks.getPayment).toHaveBeenCalledWith(paymentId);

        // Verify Sales were looked up
        expect(prisma.venta.findUnique).toHaveBeenCalledWith({ where: { id: saleId } });

        // Verify Status and Payment Method Updated
        expect(prisma.venta.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: saleId },
            data: { estado: VentaEstado.APROBADO }
        }));

        expect(prisma.venta.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: saleId },
            data: expect.objectContaining({ medioPago: 'MERCADOPAGO' })
        }));
    });

    it('should NOT update if sale already approved', async () => {
        const paymentId = '12345';
        const saleId = 100;

        mocks.getPayment.mockResolvedValue({
            status: 'approved',
            external_reference: String(saleId)
        });

        const mockSale = {
            id: saleId,
            estado: VentaEstado.APROBADO, // Already approved
        };

        vi.mocked(prisma.venta.findUnique).mockResolvedValue(mockSale as any);

        await service.processMPWebhook(paymentId);

        expect(prisma.venta.update).not.toHaveBeenCalled();
    });

    it('should NOT update if payment not approved', async () => {
        const paymentId = '12345';
        mocks.getPayment.mockResolvedValue({
            status: 'pending', // Not approved
            external_reference: '100'
        });

        await service.processMPWebhook(paymentId);

        expect(prisma.venta.findUnique).not.toHaveBeenCalled();
        expect(prisma.venta.update).not.toHaveBeenCalled();
    });
});
