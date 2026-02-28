import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { mockService, mockMPCreate } = vi.hoisted(() => ({
    mockService: {
        getQuote: vi.fn(),
        createSale: vi.fn(),
        findById: vi.fn(),
        createManualSale: vi.fn(),
        uploadReceipt: vi.fn(),
        updatePaymentMethod: vi.fn(),
        cancelOrder: vi.fn(),
        findByUserId: vi.fn(),
        findAll: vi.fn(),
        updateStatus: vi.fn(),
        getMonthlyBalance: vi.fn(),
        createShipmentForSale: vi.fn(),
        getShipmentLabel: vi.fn(),
        processMPWebhook: vi.fn(),
    },
    mockMPCreate: vi.fn().mockResolvedValue('https://mp.com/pay'),
}));

vi.mock('./sales.service', () => ({
    SalesService: class {
        getQuote = mockService.getQuote;
        createSale = mockService.createSale;
        findById = mockService.findById;
        createManualSale = mockService.createManualSale;
        uploadReceipt = mockService.uploadReceipt;
        updatePaymentMethod = mockService.updatePaymentMethod;
        cancelOrder = mockService.cancelOrder;
        findByUserId = mockService.findByUserId;
        findAll = mockService.findAll;
        updateStatus = mockService.updateStatus;
        getMonthlyBalance = mockService.getMonthlyBalance;
        createShipmentForSale = mockService.createShipmentForSale;
        getShipmentLabel = mockService.getShipmentLabel;
        processMPWebhook = mockService.processMPWebhook;
    }
}));

vi.mock('../../shared/services/MercadoPagoService', () => ({
    MercadoPagoService: class {
        createPreference = mockMPCreate;
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        venta: { update: vi.fn() }
    }
}));

import {
    quoteShipping, createSale, createMPPreference, createManualSale,
    uploadReceipt, updatePaymentMethod, cancelOrder, getMySales,
    handleMPCallback, handleMPWebhook, getSaleById, getAllSales,
    updateStatus, dispatchSale, getBalance, createZipnovaShipment, getShipmentLabel
} from './sales.controller';

function mockReqRes(overrides: any = {}) {
    const json = vi.fn();
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ json, send });
    const redirect = vi.fn();
    const res = { status, json, redirect, send } as any;
    const req = { body: {}, params: {}, query: {}, user: { id: 1 }, ...overrides } as any;
    return { req, res, json, status, redirect, send };
}

describe('Sales Controller - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.FRONTEND_URL = 'http://localhost:4321';
    });

    describe('quoteShipping', () => {
        it('should return 400 if no zipCode', async () => {
            const { req, res, status } = mockReqRes({ body: {} });
            await quoteShipping(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if items not array', async () => {
            const { req, res, status } = mockReqRes({ body: { zipCode: '2000', items: 'bad' } });
            await quoteShipping(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return quote on success', async () => {
            mockService.getQuote.mockResolvedValue(5000);
            const { req, res, json } = mockReqRes({ body: { zipCode: '2000', items: [{ id: 1, quantity: 1 }] } });
            await quoteShipping(req, res);
            expect(json).toHaveBeenCalledWith({ success: true, data: { cost: 5000 } });
        });

        it('should return 500 on error', async () => {
            mockService.getQuote.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ body: { zipCode: '2000', items: [] } });
            await quoteShipping(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('createSale', () => {
        it('should return 401 if no user', async () => {
            const { req, res, status } = mockReqRes({ user: undefined });
            await createSale(req, res);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should create sale successfully', async () => {
            mockService.createSale.mockResolvedValue({ id: 1 });
            const { req, res, status } = mockReqRes({
                body: { items: [{ id: 1, quantity: 1 }], subtotal: 100, tipoEntrega: 'RETIRO', medioPago: 'EFECTIVO' }
            });
            await createSale(req, res);
            expect(status).toHaveBeenCalledWith(201);
        });

        it('should return 400 on Zod error', async () => {
            const { req, res, status } = mockReqRes({ body: { items: [], subtotal: -1 } });
            await createSale(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 400 on stock error', async () => {
            mockService.createSale.mockRejectedValue(new Error('Stock insuficiente'));
            const { req, res, status } = mockReqRes({
                body: { items: [{ id: 1, quantity: 1 }], subtotal: 100, tipoEntrega: 'RETIRO', medioPago: 'EFECTIVO' }
            });
            await createSale(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 500 on unknown error', async () => {
            mockService.createSale.mockRejectedValue(new Error('Unknown'));
            const { req, res, status } = mockReqRes({
                body: { items: [{ id: 1, quantity: 1 }], subtotal: 100, tipoEntrega: 'RETIRO', medioPago: 'EFECTIVO' }
            });
            await createSale(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('createMPPreference', () => {
        it('should return 404 if sale not found', async () => {
            mockService.findById.mockResolvedValue(null);
            const { req, res, status } = mockReqRes({ params: { id: '999' } });
            await createMPPreference(req, res);
            expect(status).toHaveBeenCalledWith(404);
        });

        it('should return preference link on success', async () => {
            mockService.findById.mockResolvedValue({
                id: 1,
                tipoEntrega: 'ENVIO',
                costoEnvio: 5000,
                lineasVenta: [{ productoId: 1, subTotal: 1000, cantidad: 1, producto: { nombre: 'GPU' } }],
                cliente: { user: { email: 'u@t.com' } }
            });
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await createMPPreference(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            mockService.findById.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await createMPPreference(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('createManualSale', () => {
        it('should return 401 if no admin', async () => {
            const { req, res, status } = mockReqRes({ user: undefined });
            await createManualSale(req, res);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should create manual sale', async () => {
            mockService.createManualSale.mockResolvedValue({ id: 10 });
            const { req, res, status } = mockReqRes({
                body: {
                    customerEmail: 'u@t.com',
                    items: [{ id: 1, quantity: 1 }],
                    medioPago: 'EFECTIVO'
                }
            });
            await createManualSale(req, res);
            expect(status).toHaveBeenCalledWith(201);
        });

        it('should return 400 on invalid data', async () => {
            const { req, res, status } = mockReqRes({ body: {} });
            await createManualSale(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 400 on product not found', async () => {
            mockService.createManualSale.mockRejectedValue(new Error('Producto no encontrado'));
            const { req, res, status } = mockReqRes({
                body: { customerEmail: 'u@t.com', items: [{ id: 99, quantity: 1 }], medioPago: 'EFECTIVO' }
            });
            await createManualSale(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 500 on unknown error', async () => {
            mockService.createManualSale.mockRejectedValue(new Error('DB error'));
            const { req, res, status } = mockReqRes({
                body: { customerEmail: 'u@t.com', items: [{ id: 1, quantity: 1 }], medioPago: 'EFECTIVO' }
            });
            await createManualSale(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('uploadReceipt', () => {
        it('should upload receipt with file', async () => {
            mockService.uploadReceipt.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({
                params: { id: '1' },
                file: { path: 'https://cloudinary.com/receipt.jpg' }
            });
            await uploadReceipt(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should upload receipt without file', async () => {
            mockService.uploadReceipt.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await uploadReceipt(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockService.uploadReceipt.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await uploadReceipt(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('updatePaymentMethod', () => {
        it('should return 400 on invalid method', async () => {
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: { medioPago: 'BITCOIN' } });
            await updatePaymentMethod(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should update valid method', async () => {
            mockService.updatePaymentMethod.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' }, body: { medioPago: 'TRANSFERENCIA' } });
            await updatePaymentMethod(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockService.updatePaymentMethod.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: { medioPago: 'EFECTIVO' } });
            await updatePaymentMethod(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('cancelOrder', () => {
        it('should cancel order', async () => {
            mockService.cancelOrder.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await cancelOrder(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockService.cancelOrder.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await cancelOrder(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMySales', () => {
        it('should return 401 if no user', async () => {
            const { req, res, status } = mockReqRes({ user: undefined });
            await getMySales(req, res);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return user sales', async () => {
            mockService.findByUserId.mockResolvedValue([{ id: 1 }]);
            const { req, res, json } = mockReqRes();
            await getMySales(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('handleMPCallback', () => {
        it('should redirect on approved', async () => {
            const { prisma } = await import('../../shared/database/prismaClient');
            (prisma.venta.update as any).mockResolvedValue({});
            const { req, res, redirect } = mockReqRes({ query: { status: 'approved', external_reference: '1' } });
            await handleMPCallback(req, res);
            expect(redirect).toHaveBeenCalled();
        });

        it('should redirect without update on non-approved', async () => {
            const { req, res, redirect } = mockReqRes({ query: { status: 'pending', external_reference: '1' } });
            await handleMPCallback(req, res);
            expect(redirect).toHaveBeenCalled();
        });

        it('should redirect to error on exception', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            const { prisma } = await import('../../shared/database/prismaClient');
            (prisma.venta.update as any).mockRejectedValue(new Error('Fail'));
            const { req, res, redirect } = mockReqRes({ query: { status: 'approved', external_reference: '1' } });
            await handleMPCallback(req, res);
            expect(redirect).toHaveBeenCalledWith(expect.stringContaining('error'));
        });
    });

    describe('handleMPWebhook', () => {
        it('should process payment webhook', async () => {
            mockService.processMPWebhook.mockResolvedValue({});
            const { req, res, send } = mockReqRes({ body: { type: 'payment', data: { id: '123' } } });
            await handleMPWebhook(req, res);
            expect(send).toHaveBeenCalledWith('OK');
        });

        it('should ignore non-payment types', async () => {
            const { req, res, send } = mockReqRes({ body: { type: 'other', data: {} } });
            await handleMPWebhook(req, res);
            expect(send).toHaveBeenCalledWith('OK');
        });

        it('should return 500 on error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            mockService.processMPWebhook.mockRejectedValue(new Error('Fail'));
            const { req, res, status, send } = mockReqRes({ body: { type: 'payment', data: { id: '123' } } });
            await handleMPWebhook(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getSaleById', () => {
        it('should return 404 if not found', async () => {
            mockService.findById.mockResolvedValue(null);
            const { req, res, status } = mockReqRes({ params: { id: '999' } });
            await getSaleById(req, res);
            expect(status).toHaveBeenCalledWith(404);
        });

        it('should return sale', async () => {
            mockService.findById.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await getSaleById(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getAllSales', () => {
        it('should return paginated sales', async () => {
            mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            const { req, res, json } = mockReqRes({ query: { page: '1', month: '12', year: '2024', date: '2024-12-01', paymentMethod: 'EFECTIVO' } });
            await getAllSales(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('updateStatus', () => {
        it('should return 400 on invalid status', async () => {
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: { status: 'INVALID' } });
            await updateStatus(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should update status', async () => {
            mockService.updateStatus.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' }, body: { status: 'APROBADO' } });
            await updateStatus(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('dispatchSale', () => {
        it('should return 400 if no trackingCode', async () => {
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: {} });
            await dispatchSale(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should dispatch sale', async () => {
            mockService.updateStatus.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' }, body: { trackingCode: 'TRACK-1' } });
            await dispatchSale(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getBalance', () => {
        it('should return balance', async () => {
            mockService.getMonthlyBalance.mockResolvedValue([]);
            const { req, res, json } = mockReqRes({ query: { year: '2024' } });
            await getBalance(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should use current year as default', async () => {
            mockService.getMonthlyBalance.mockResolvedValue([]);
            const { req, res } = mockReqRes({ query: {} });
            await getBalance(req, res);
            expect(mockService.getMonthlyBalance).toHaveBeenCalledWith(new Date().getFullYear());
        });
    });

    describe('createZipnovaShipment', () => {
        it('should create shipment', async () => {
            mockService.createShipmentForSale.mockResolvedValue({ shipmentId: 'S1' });
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await createZipnovaShipment(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockService.createShipmentForSale.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await createZipnovaShipment(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getShipmentLabel', () => {
        it('should return 404 if no label', async () => {
            mockService.getShipmentLabel.mockResolvedValue(null);
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await getShipmentLabel(req, res);
            expect(status).toHaveBeenCalledWith(404);
        });

        it('should return label URL', async () => {
            mockService.getShipmentLabel.mockResolvedValue('http://label.com/1.pdf');
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await getShipmentLabel(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockService.getShipmentLabel.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await getShipmentLabel(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });
});
