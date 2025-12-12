import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as TechnicalController from './technical.controller';
import { TechnicalService } from './technical.service';

vi.mock('./technical.service');

describe('TechnicalController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any;
    let status: any;

    beforeEach(() => {
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        req = { user: { id: 1 }, body: {} } as any;
        res = {
            json,
            status,
        };
        vi.clearAllMocks();
    });

    describe('createInquiry', () => {
        it('should create inquiry', async () => {
            req.body = { asunto: 'Issue', mensaje: 'Help' };
            const inquiry = { id: 1 };
            vi.spyOn(TechnicalService.prototype, 'createInquiry').mockResolvedValue(inquiry as any);

            await TechnicalController.createInquiry(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(json).toHaveBeenCalledWith({ success: true, data: inquiry });
        });

        it('should return 401 if unauth', async () => {
            (req as any).user = undefined;

            await TechnicalController.createInquiry(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('getMyInquiries', () => {
        it('should return user inquiries', async () => {
            const inquiries = [{ id: 1 }];
            vi.spyOn(TechnicalService.prototype, 'findInquiriesByUserId').mockResolvedValue(inquiries as any);

            await TechnicalController.getMyInquiries(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: inquiries });
        });
    });

    describe('deleteInquiry', () => {
        it('should delete inquiry', async () => {
            req.params = { id: '1' };
            vi.spyOn(TechnicalService.prototype, 'deleteInquiry').mockResolvedValue({ id: 1 } as any);

            await TechnicalController.deleteInquiry(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Consulta eliminada' });
        });

        it('should return 500 on error', async () => {
            req.params = { id: '1' };
            vi.spyOn(TechnicalService.prototype, 'deleteInquiry').mockRejectedValue(new Error('Error'));

            await TechnicalController.deleteInquiry(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updatePrice', () => {
        it('should update price', async () => {
            req.params = { id: '1' };
            req.body = { price: 100 };
            const updated = { id: 1, price: 100 };
            vi.spyOn(TechnicalService.prototype, 'updateServicePrice').mockResolvedValue(updated as any);

            await TechnicalController.updatePrice(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
        });

        it('should return 400 if price invalid', async () => {
            req.params = { id: '1' };
            req.body = {};

            await TechnicalController.updatePrice(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
