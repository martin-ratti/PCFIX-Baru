import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from './sales.service';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        venta: { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
        producto: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        cliente: { findUnique: vi.fn(), create: vi.fn() },
        user: { findUnique: vi.fn(), create: vi.fn() },
        configuracion: { findFirst: vi.fn() },
        lineaVenta: { update: vi.fn() },
        $transaction: vi.fn((arg) => {
            if (Array.isArray(arg)) return Promise.all(arg);
            return arg(prisma);
        })
    }
}));

vi.mock('../../shared/services/EmailService', () => ({
    EmailService: class {
        sendNewReceiptNotification = vi.fn().mockResolvedValue(true);
        sendStatusUpdate = vi.fn().mockResolvedValue(true);
        sendNewShipmentNotification = vi.fn().mockResolvedValue(true);
    }
}));

vi.mock('../../shared/services/ShippingService', () => ({
    ShippingService: class {
        calculateCost = vi.fn().mockResolvedValue(5000);
        createShipment = vi.fn().mockResolvedValue({ shipmentId: 'S1', trackingCode: 'T1', labelUrl: 'http://l', carrier: 'CA' });
        getLabel = vi.fn().mockResolvedValue('http://label.pdf');
    },
    ShippingItem: {}
}));

vi.mock('../../shared/services/MercadoPagoService', () => ({
    MercadoPagoService: class {
        getPayment = vi.fn();
    }
}));

describe('SalesService - Full Coverage', () => {
    let service: SalesService;

    beforeEach(() => {
        service = new SalesService();
        vi.clearAllMocks();
        (prisma.$transaction as any).mockImplementation((arg: any) => {
            if (Array.isArray(arg)) return Promise.all(arg);
            return arg(prisma);
        });
    });

    describe('getQuote', () => {
        it('should calculate shipping quote', async () => {
            (prisma.producto.findMany as any).mockResolvedValue([
                { id: 1, peso: 2, alto: 15, ancho: 30, profundidad: 10 }
            ]);
            const cost = await service.getQuote('2000', [{ id: 1, quantity: 1 }]);
            expect(cost).toBe(5000);
        });

        it('should use defaults for missing product dimensions', async () => {
            (prisma.producto.findMany as any).mockResolvedValue([{ id: 1 }]);
            const cost = await service.getQuote('2000', [{ id: 1, quantity: 2 }]);
            expect(cost).toBe(5000);
        });
    });

    describe('findAll', () => {
        it('should return paginated sales', async () => {
            (prisma.venta.count as any).mockResolvedValue(10);
            (prisma.venta.findMany as any).mockResolvedValue([{ id: 1 }]);
            const result = await service.findAll(1, 10);
            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(10);
        });

        it('should filter by month and year', async () => {
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.venta.findMany as any).mockResolvedValue([]);
            await service.findAll(1, 10, undefined, 12, 2024);
            expect(prisma.venta.findMany).toHaveBeenCalled();
        });

        it('should filter by year only', async () => {
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.venta.findMany as any).mockResolvedValue([]);
            await service.findAll(1, 10, undefined, undefined, 2024);
            expect(prisma.venta.findMany).toHaveBeenCalled();
        });

        it('should filter by date', async () => {
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.venta.findMany as any).mockResolvedValue([]);
            await service.findAll(1, 10, undefined, undefined, undefined, undefined, '2025-01-15');
            expect(prisma.venta.findMany).toHaveBeenCalled();
        });

        it('should filter by userId', async () => {
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.venta.findMany as any).mockResolvedValue([]);
            await service.findAll(1, 10, 5);
            expect(prisma.venta.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ cliente: { userId: 5 } })
            }));
        });

        it('should filter by paymentMethod', async () => {
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.venta.findMany as any).mockResolvedValue([]);
            await service.findAll(1, 10, undefined, undefined, undefined, 'EFECTIVO');
            expect(prisma.venta.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ medioPago: 'EFECTIVO' })
            }));
        });
    });

    describe('findById', () => {
        it('should return sale', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ id: 1 });
            const sale = await service.findById(1);
            expect(sale).toEqual({ id: 1 });
        });
    });

    describe('findByUserId', () => {
        it('should return user sales', async () => {
            (prisma.venta.findMany as any).mockResolvedValue([{ id: 1 }]);
            const sales = await service.findByUserId(1);
            expect(sales).toHaveLength(1);
        });
    });

    describe('createSale', () => {
        const mockProduct = { id: 1, nombre: 'GPU', precio: 1000, stock: 10, peso: 1, alto: 10, ancho: 10, profundidad: 10 };

        it('should create sale with RETIRO', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([mockProduct]);
            (prisma.venta.create as any).mockResolvedValue({ id: 1, lineasVenta: [] });
            (prisma.producto.update as any).mockResolvedValue({});

            const result = await service.createSale(1, [{ id: 1, quantity: 1 }], 1000, undefined, 'RETIRO', 'EFECTIVO');
            expect(result.id).toBe(1);
        });

        it('should create sale with ENVIO and cpDestino', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([mockProduct]);
            (prisma.venta.create as any).mockResolvedValue({ id: 2, lineasVenta: [] });
            (prisma.producto.update as any).mockResolvedValue({});

            const result = await service.createSale(1, [{ id: 1, quantity: 1 }], 1000, '2000', 'ENVIO', 'TRANSFERENCIA');
            expect(result.id).toBe(2);
        });

        it('should create sale with ENVIO without cpDestino (fixed cost)', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([mockProduct]);
            (prisma.configuracion.findFirst as any).mockResolvedValue({ costoEnvioFijo: 7000 });
            (prisma.venta.create as any).mockResolvedValue({ id: 3, lineasVenta: [] });
            (prisma.producto.update as any).mockResolvedValue({});

            await service.createSale(1, [{ id: 1, quantity: 1 }], 1000, undefined, 'ENVIO', 'EFECTIVO');
            expect(prisma.venta.create).toHaveBeenCalled();
        });

        it('should create cliente if not exists', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue(null);
            (prisma.cliente.create as any).mockResolvedValue({ id: 2 });
            (prisma.producto.findMany as any).mockResolvedValue([mockProduct]);
            (prisma.venta.create as any).mockResolvedValue({ id: 4, lineasVenta: [] });
            (prisma.producto.update as any).mockResolvedValue({});

            await service.createSale(1, [{ id: 1, quantity: 1 }], 1000, undefined, 'RETIRO');
            expect(prisma.cliente.create).toHaveBeenCalled();
        });

        it('should throw on product not found', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([]);
            await expect(service.createSale(1, [{ id: 99, quantity: 1 }], 1000)).rejects.toThrow('no encontrado');
        });

        it('should throw on insufficient stock', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([{ ...mockProduct, stock: 0 }]);
            await expect(service.createSale(1, [{ id: 1, quantity: 5 }], 1000)).rejects.toThrow('Stock insuficiente');
        });

        it('should NOT apply discount for MERCADOPAGO', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([mockProduct]);
            (prisma.venta.create as any).mockResolvedValue({ id: 5, lineasVenta: [] });
            (prisma.producto.update as any).mockResolvedValue({});

            await service.createSale(1, [{ id: 1, quantity: 1 }], 1000, undefined, 'RETIRO', 'MERCADOPAGO');
            expect(prisma.venta.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ montoTotal: 1000 })
            }));
        });

        it('should skip stock decrement for unlimited stock products', async () => {
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([{ ...mockProduct, stock: 99999 }]);
            (prisma.venta.create as any).mockResolvedValue({ id: 6, lineasVenta: [{ productoId: 1, cantidad: 1 }] });

            await service.createSale(1, [{ id: 1, quantity: 1 }], 1000, undefined, 'RETIRO');
            expect(prisma.producto.update).not.toHaveBeenCalled();
        });
    });

    describe('createManualSale', () => {
        it('should create manual sale with existing user', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, email: 't@t.com' });
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([{ id: 1, nombre: 'P', precio: 500, stock: 10 }]);
            (prisma.venta.create as any).mockResolvedValue({ id: 1 });
            (prisma.producto.update as any).mockResolvedValue({});

            await service.createManualSale({ customerEmail: 't@t.com', items: [{ id: 1, quantity: 1 }], medioPago: 'EFECTIVO', estado: 'APROBADO' });
            expect(prisma.venta.create).toHaveBeenCalled();
        });

        it('should create user if not exists', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            (prisma.user.create as any).mockResolvedValue({ id: 2, email: 'new@t.com' });
            (prisma.cliente.findUnique as any).mockResolvedValue(null);
            (prisma.cliente.create as any).mockResolvedValue({ id: 2 });
            (prisma.producto.findMany as any).mockResolvedValue([{ id: 1, nombre: 'P', precio: 500, stock: 10 }]);
            (prisma.venta.create as any).mockResolvedValue({ id: 2 });
            (prisma.producto.update as any).mockResolvedValue({});

            await service.createManualSale({ customerEmail: 'new@t.com', items: [{ id: 1, quantity: 1 }], medioPago: 'EFECTIVO', estado: 'APROBADO' });
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('should use custom price', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.cliente.findUnique as any).mockResolvedValue({ id: 1 });
            (prisma.producto.findMany as any).mockResolvedValue([{ id: 1, nombre: 'Service', precio: 0, stock: 99999 }]);
            (prisma.venta.create as any).mockResolvedValue({ id: 10 });

            await service.createManualSale({ customerEmail: 't@t.com', items: [{ id: 1, quantity: 1, customPrice: 5000, customDescription: 'Custom' }], medioPago: 'EFECTIVO', estado: 'APROBADO' });
            expect(prisma.venta.create).toHaveBeenCalled();
        });
    });

    describe('uploadReceipt', () => {
        it('should upload receipt with URL', async () => {
            (prisma.venta.update as any).mockResolvedValue({ id: 1, cliente: { user: { email: 'u@t.com' } } });
            await service.uploadReceipt(1, 'http://receipt.jpg');
            expect(prisma.venta.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ comprobante: 'http://receipt.jpg' })
            }));
        });

        it('should upload receipt without URL', async () => {
            (prisma.venta.update as any).mockResolvedValue({ id: 1, cliente: { user: { email: 'u@t.com' } } });
            await service.uploadReceipt(1);
            expect(prisma.venta.update).toHaveBeenCalled();
        });
    });

    describe('updatePaymentMethod', () => {
        it('should throw if sale not found', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue(null);
            await expect(service.updatePaymentMethod(99, 'EFECTIVO')).rejects.toThrow('Venta no encontrada');
        });

        it('should update payment method and recalculate totals', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({
                id: 1, costoEnvio: 500,
                lineasVenta: [{ id: 10, cantidad: 2, producto: { precio: 1000 } }]
            });
            (prisma.lineaVenta.update as any).mockResolvedValue({});
            (prisma.venta.update as any).mockResolvedValue({ id: 1 });

            await service.updatePaymentMethod(1, 'EFECTIVO');
            expect(prisma.lineaVenta.update).toHaveBeenCalled();
        });
    });

    describe('cancelOrder', () => {
        it('should throw if not found', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue(null);
            await expect(service.cancelOrder(99)).rejects.toThrow('Venta no encontrada');
        });

        it('should cancel order and restore stock', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ id: 1, lineasVenta: [{ productoId: 1, cantidad: 2 }] });
            (prisma.producto.findUnique as any).mockResolvedValue({ id: 1, stock: 5 });
            (prisma.producto.update as any).mockResolvedValue({});
            (prisma.venta.update as any).mockResolvedValue({});

            const result = await service.cancelOrder(1);
            expect(result.success).toBe(true);
        });
    });

    describe('updateStatus', () => {
        it('should update status and send email', async () => {
            (prisma.venta.update as any).mockResolvedValue({ id: 1, tipoEntrega: 'ENVIO', cliente: { user: { email: 'u@t.com' } } });
            const result = await service.updateStatus(1, 'APROBADO' as any);
            expect(result.id).toBe(1);
        });
    });

    describe('getMonthlyBalance', () => {
        it('should return 12 months of balance', async () => {
            (prisma.venta.findMany as any).mockResolvedValue([]);
            const result = await service.getMonthlyBalance(2024);
            expect(result).toHaveLength(12);
        });

        it('should categorize services vs products', async () => {
            const mockVentas = [{
                fecha: new Date(2024, 0, 15),
                costoEnvio: 500,
                lineasVenta: [
                    { subTotal: 1000, producto: { stock: 99999, categoria: { nombre: 'Servicio Técnico' } } },
                    { subTotal: 2000, producto: { stock: 5, categoria: { nombre: 'Componentes' } } }
                ]
            }];
            (prisma.venta.findMany as any).mockResolvedValue(mockVentas);
            const result = await service.getMonthlyBalance(2024);
            expect(result).toHaveLength(12);
        });
    });

    describe('getShipmentLabel', () => {
        it('should throw if sale not found', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue(null);
            await expect(service.getShipmentLabel(99)).rejects.toThrow('Venta no encontrada');
        });

        it('should return existing label URL', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ etiquetaUrl: 'http://label.pdf' });
            const url = await service.getShipmentLabel(1);
            expect(url).toBe('http://label.pdf');
        });

        it('should fetch label from Zipnova if shipmentId exists', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ etiquetaUrl: null, zipnovaShipmentId: 'S1' });
            (prisma.venta.update as any).mockResolvedValue({});
            const url = await service.getShipmentLabel(1);
            expect(url).toBe('http://label.pdf');
        });

        it('should return null on Zipnova error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            (prisma.venta.findUnique as any).mockResolvedValue({ etiquetaUrl: null, zipnovaShipmentId: 'S1' });
            const shippingService = (service as any).shippingService;
            shippingService.getLabel = vi.fn().mockRejectedValue(new Error('API Error'));
            const url = await service.getShipmentLabel(1);
            expect(url).toBeNull();
        });

        it('should return null if no label and no shipmentId', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ etiquetaUrl: null, zipnovaShipmentId: null });
            const url = await service.getShipmentLabel(1);
            expect(url).toBeNull();
        });
    });

    describe('createShipmentForSale', () => {
        it('should throw if sale not found', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue(null);
            await expect(service.createShipmentForSale(99)).rejects.toThrow('Venta no encontrada');
        });

        it('should throw if not ENVIO', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ tipoEntrega: 'RETIRO' });
            await expect(service.createShipmentForSale(1)).rejects.toThrow('retiro en local');
        });

        it('should throw if already has shipment', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ tipoEntrega: 'ENVIO', zipnovaShipmentId: 'S1' });
            await expect(service.createShipmentForSale(1)).rejects.toThrow('ya tiene un envío');
        });

        it('should throw if missing address', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({ tipoEntrega: 'ENVIO', zipnovaShipmentId: null, direccionEnvio: null });
            await expect(service.createShipmentForSale(1)).rejects.toThrow('Faltan datos de dirección');
        });

        it('should create shipment successfully', async () => {
            (prisma.venta.findUnique as any).mockResolvedValue({
                id: 1, tipoEntrega: 'ENVIO', zipnovaShipmentId: null,
                direccionEnvio: 'Calle 1', ciudadEnvio: 'Rosario', provinciaEnvio: 'Santa Fe', cpEnvio: '2000',
                telefonoEnvio: '123', documentoEnvio: '12345', montoTotal: 50000,
                lineasVenta: [{ cantidad: 1, producto: { id: 1, nombre: 'GPU', peso: 2, alto: 15, ancho: 30, profundidad: 10 } }],
                cliente: { user: { nombre: 'Juan', apellido: 'P', email: 'u@t.com' } }
            });
            (prisma.venta.update as any).mockResolvedValue({});

            const result = await service.createShipmentForSale(1);
            expect(result.shipmentId).toBe('S1');
            expect(result.trackingCode).toBe('T1');
        });
    });

    describe('processMPWebhook', () => {
        it('should process approved payment', async () => {
            const mpMock = (service as any);
            const { MercadoPagoService } = await import('../../shared/services/MercadoPagoService');
            const mockGetPayment = vi.fn().mockResolvedValue({ status: 'approved', external_reference: '1' });

            (prisma.venta.findUnique as any).mockResolvedValue({ id: 1, estado: 'PENDIENTE_PAGO' });
            (prisma.venta.update as any).mockResolvedValue({ id: 1, cliente: { user: { email: 'u@t.com' } }, tipoEntrega: 'RETIRO' });
            (prisma.lineaVenta.update as any).mockResolvedValue({});

            const originalProcess = service.processMPWebhook.bind(service);
        });
    });
});
