import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as ConfigController from './config.controller';
import { prisma } from '../../shared/database/prismaClient';
import { EmailService } from '../../shared/services/EmailService';
import { CryptoService } from '../../shared/services/CryptoService';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        configuracion: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('../../shared/services/EmailService');
vi.mock('../../shared/services/CryptoService');

describe('ConfigController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any;
    let status: any;

    beforeEach(() => {
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        req = {};
        res = {
            json,
            status,
        };
        vi.clearAllMocks();
    });

    describe('getConfig', () => {
        it('should return existing config', async () => {
            const config = { id: 1, nombreBanco: 'Test' };
            vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(config as any);

            await ConfigController.getConfig(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: config });
        });

        it('should create default config if not found', async () => {
            vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
            const newConfig = { id: 1, nombreBanco: 'Default' };
            vi.mocked(prisma.configuracion.create).mockResolvedValue(newConfig as any);

            await ConfigController.getConfig(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: newConfig });
        });
    });

    describe('updateConfig', () => {
        it('should update config', async () => {
            req.body = { nombreBanco: 'Updated' };
            const updated = { id: 1, nombreBanco: 'Updated' };
            vi.mocked(prisma.configuracion.update).mockResolvedValue(updated as any);

            await ConfigController.updateConfig(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
        });
    });

    describe('sendContactEmail', () => {
        it('should send contact email successfully', async () => {
            req.body = { nombre: 'John', email: 'john@test.com', mensaje: 'Hello' };

            const sendNewInquiryNotification = vi.spyOn(EmailService.prototype, 'sendNewInquiryNotification').mockResolvedValue(true);
            const sendContactConfirmationEmail = vi.spyOn(EmailService.prototype, 'sendContactConfirmationEmail').mockResolvedValue(true);

            await ConfigController.sendContactEmail(req as Request, res as Response);

            expect(sendNewInquiryNotification).toHaveBeenCalled();
            expect(sendContactConfirmationEmail).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Consulta enviada correctamente' });
        });

        it('should return 400 if required fields missing', async () => {
            req.body = { nombre: 'John' };

            await ConfigController.sendContactEmail(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Faltan datos obligatorios' });
        });
    });
});
