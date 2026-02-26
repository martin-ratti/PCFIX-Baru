import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { mockTechService } = vi.hoisted(() => ({
    mockTechService: {
        createInquiry: vi.fn(),
        findAllInquiries: vi.fn(),
        findInquiriesByUserId: vi.fn(),
        replyInquiry: vi.fn(),
        deleteInquiry: vi.fn(),
        getServicePrices: vi.fn(),
        updateServicePrice: vi.fn(),
    }
}));

vi.mock('./technical.service', () => ({
    TechnicalService: class {
        createInquiry = mockTechService.createInquiry;
        findAllInquiries = mockTechService.findAllInquiries;
        findInquiriesByUserId = mockTechService.findInquiriesByUserId;
        replyInquiry = mockTechService.replyInquiry;
        deleteInquiry = mockTechService.deleteInquiry;
        getServicePrices = mockTechService.getServicePrices;
        updateServicePrice = mockTechService.updateServicePrice;
    }
}));

import * as TC from './technical.controller';

function mockReqRes(overrides: any = {}) {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status, json } as any;
    const req = { body: {}, params: {}, query: {}, user: { id: 1 }, ...overrides } as any;
    return { req, res, json, status };
}

describe('TechnicalController - Full Coverage', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('createInquiry', () => {
        it('should create inquiry', async () => {
            mockTechService.createInquiry.mockResolvedValue({ id: 1 });
            const { req, res, status } = mockReqRes({ body: { asunto: 'Help', mensaje: 'Msg' } });
            await TC.createInquiry(req, res);
            expect(status).toHaveBeenCalledWith(201);
        });

        it('should return 401 if no user', async () => {
            const { req, res, status } = mockReqRes({ user: undefined });
            await TC.createInquiry(req, res);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return 400 on error', async () => {
            mockTechService.createInquiry.mockRejectedValue(new Error('Bad'));
            const { req, res, status } = mockReqRes({ body: { asunto: 'H', mensaje: 'M' } });
            await TC.createInquiry(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });
    });

    describe('getAllInquiries', () => {
        it('should return paginated inquiries', async () => {
            mockTechService.findAllInquiries.mockResolvedValue({ data: [], meta: { total: 0 } });
            const { req, res, json } = mockReqRes({ query: { page: '2' } });
            await TC.getAllInquiries(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should use page 1 by default', async () => {
            mockTechService.findAllInquiries.mockResolvedValue({ data: [] });
            const { req, res } = mockReqRes({ query: {} });
            await TC.getAllInquiries(req, res);
            expect(mockTechService.findAllInquiries).toHaveBeenCalledWith(1, 20);
        });

        it('should return 500 on error', async () => {
            mockTechService.findAllInquiries.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ query: {} });
            await TC.getAllInquiries(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMyInquiries', () => {
        it('should return 401 if no user', async () => {
            const { req, res, status } = mockReqRes({ user: undefined });
            await TC.getMyInquiries(req, res);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should return user inquiries', async () => {
            mockTechService.findInquiriesByUserId.mockResolvedValue([{ id: 1 }]);
            const { req, res, json } = mockReqRes();
            await TC.getMyInquiries(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockTechService.findInquiriesByUserId.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes();
            await TC.getMyInquiries(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('replyInquiry', () => {
        it('should reply to inquiry', async () => {
            mockTechService.replyInquiry.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' }, body: { respuesta: 'OK' } });
            await TC.replyInquiry(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockTechService.replyInquiry.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: { respuesta: 'X' } });
            await TC.replyInquiry(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteInquiry', () => {
        it('should delete inquiry', async () => {
            mockTechService.deleteInquiry.mockResolvedValue({});
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await TC.deleteInquiry(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockTechService.deleteInquiry.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await TC.deleteInquiry(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getPrices', () => {
        it('should return prices', async () => {
            mockTechService.getServicePrices.mockResolvedValue([{ id: 1, price: 100 }]);
            const { req, res, json } = mockReqRes();
            await TC.getPrices(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockTechService.getServicePrices.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes();
            await TC.getPrices(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('updatePrice', () => {
        it('should update price', async () => {
            mockTechService.updateServicePrice.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({ params: { id: '1' }, body: { price: 200 } });
            await TC.updatePrice(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 on undefined price', async () => {
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: {} });
            await TC.updatePrice(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 400 on NaN price', async () => {
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: { price: 'abc' } });
            await TC.updatePrice(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 500 on error', async () => {
            mockTechService.updateServicePrice.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: { price: 100 } });
            await TC.updatePrice(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });
});
