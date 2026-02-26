import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { mockGetUsdtPrice } = vi.hoisted(() => ({
    mockGetUsdtPrice: vi.fn()
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        configuracion: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('../../shared/services/EmailService', () => ({
    EmailService: class {
        sendNewInquiryNotification = vi.fn().mockResolvedValue(true);
        sendContactConfirmationEmail = vi.fn().mockResolvedValue(true);
    }
}));

vi.mock('../../shared/services/CryptoService', () => ({
    CryptoService: class {
        getUsdtPrice = mockGetUsdtPrice;
    }
}));

import * as ConfigController from './config.controller';
import { prisma } from '../../shared/database/prismaClient';

describe('ConfigController - Full Coverage', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any;
    let status: any;

    beforeEach(() => {
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        req = { body: {} };
        res = { json, status };
        vi.clearAllMocks();
    });

    describe('getConfig', () => {
        it('should return existing config', async () => {
            (prisma.configuracion.findFirst as any).mockResolvedValue({ id: 1 });
            await ConfigController.getConfig(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
        });

        it('should create default config if not found', async () => {
            (prisma.configuracion.findFirst as any).mockResolvedValue(null);
            (prisma.configuracion.create as any).mockResolvedValue({ id: 1, nombreBanco: 'Default' });
            await ConfigController.getConfig(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            (prisma.configuracion.findFirst as any).mockRejectedValue(new Error('DB'));
            await ConfigController.getConfig(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateConfig', () => {
        it('should update config', async () => {
            req.body = { nombreBanco: 'New', cotizacionUsdt: '500' };
            (prisma.configuracion.update as any).mockResolvedValue({ id: 1 });
            await ConfigController.updateConfig(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should handle cotizacionUsdt as undefined', async () => {
            req.body = { nombreBanco: 'New' };
            (prisma.configuracion.update as any).mockResolvedValue({ id: 1 });
            await ConfigController.updateConfig(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            (prisma.configuracion.update as any).mockRejectedValue(new Error('DB'));
            await ConfigController.updateConfig(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('syncUsdt', () => {
        it('should sync USDT price', async () => {
            mockGetUsdtPrice.mockResolvedValue(1500);
            (prisma.configuracion.update as any).mockResolvedValue({ id: 1, cotizacionUsdt: 1500 });
            await ConfigController.syncUsdt(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: expect.stringContaining('1500') }));
        });

        it('should return 500 on error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            mockGetUsdtPrice.mockRejectedValue(new Error('API down'));
            await ConfigController.syncUsdt(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('sendContactEmail', () => {
        it('should send contact email', async () => {
            req.body = { nombre: 'Juan', apellido: 'Perez', email: 'u@t.com', mensaje: 'Hola' };
            await ConfigController.sendContactEmail(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith({ success: true, message: 'Consulta enviada correctamente' });
        });

        it('should send without apellido', async () => {
            req.body = { nombre: 'Juan', email: 'u@t.com', mensaje: 'Hola' };
            await ConfigController.sendContactEmail(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 if missing fields', async () => {
            req.body = { nombre: 'Juan' };
            await ConfigController.sendContactEmail(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if no email', async () => {
            req.body = { nombre: 'Juan', mensaje: 'Hola' };
            await ConfigController.sendContactEmail(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if no mensaje', async () => {
            req.body = { nombre: 'Juan', email: 'u@t.com' };
            await ConfigController.sendContactEmail(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });
});
