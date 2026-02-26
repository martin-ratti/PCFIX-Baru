import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('resend', () => ({
    Resend: class {
        emails = { send: mockSend };
    }
}));

vi.mock('../database/prismaClient', () => ({
    prisma: {
        configuracion: {
            findFirst: vi.fn()
        }
    }
}));

import { EmailService } from './EmailService';
import { prisma } from '../database/prismaClient';

describe('EmailService', () => {
    let service: EmailService;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.RESEND_API_KEY = 'test-key';
        process.env.EMAIL_FROM = 'test@test.com';
        process.env.REPLY_TO = 'reply@test.com';
        process.env.ADMIN_EMAIL = 'admin@test.com';
        process.env.FRONTEND_URL = 'http://localhost:4321';
        service = new EmailService();
    });

    describe('sendEmail', () => {
        it('should send email successfully and return true', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendEmail('user@test.com', 'Subject', '<p>Body</p>');
            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                from: 'test@test.com',
                replyTo: 'reply@test.com',
                to: 'user@test.com',
                subject: 'Subject',
                html: '<p>Body</p>'
            }));
        });

        it('should return false when Resend returns error', async () => {
            mockSend.mockResolvedValue({ data: null, error: { message: 'fail' } });
            const result = await service.sendEmail('user@test.com', 'Subject', '<p>Body</p>');
            expect(result).toBe(false);
        });

        it('should return false on exception', async () => {
            mockSend.mockRejectedValue(new Error('Network error'));
            const result = await service.sendEmail('user@test.com', 'Subject', '<p>Body</p>');
            expect(result).toBe(false);
        });

        it('should use default from and replyTo when env vars not set', async () => {
            delete process.env.EMAIL_FROM;
            delete process.env.REPLY_TO;
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            await service.sendEmail('user@test.com', 'Subject', '<p>Body</p>');
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                from: 'PCFIX <noreply@pcfixbaru.com.ar>',
                replyTo: 'pcfixbaru@gmail.com'
            }));
        });
    });

    describe('getBusinessHours (private)', () => {
        it('should return hours from database', async () => {
            (prisma.configuracion.findFirst as any).mockResolvedValue({ horariosLocal: '9 a 18' });
            const hours = await (service as any).getBusinessHours();
            expect(hours).toBe('9 a 18');
        });

        it('should return default hours when no config found', async () => {
            (prisma.configuracion.findFirst as any).mockResolvedValue(null);
            const hours = await (service as any).getBusinessHours();
            expect(hours).toBe('Lunes a Viernes de 9:00 a 18:00 hs.');
        });

        it('should return default hours on database error', async () => {
            (prisma.configuracion.findFirst as any).mockRejectedValue(new Error('DB error'));
            const hours = await (service as any).getBusinessHours();
            expect(hours).toBe('Lunes a Viernes de 9:00 a 18:00 hs.');
        });
    });

    describe('sendNewInquiryNotification', () => {
        it('should send notification email to admin', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendNewInquiryNotification('user@test.com', 'Juan', 'Consulta', 'Hola');
            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                to: 'admin@test.com'
            }));
        });
    });

    describe('sendReplyNotification', () => {
        it('should send reply to user email', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendReplyNotification('user@test.com', 'Consulta Original', 'Respuesta');
            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                to: 'user@test.com'
            }));
        });
    });

    describe('sendNewReceiptNotification', () => {
        it('should send receipt notification to admin', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendNewReceiptNotification(1, 'user@test.com');
            expect(result).toBe(true);
        });
    });

    describe('sendNewShipmentNotification', () => {
        it('should send shipment notification', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendNewShipmentNotification(1, 'user@test.com', 'SHIP-123', 'TRACK-456');
            expect(result).toBe(true);
        });
    });

    describe('sendStatusUpdate', () => {
        beforeEach(() => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
        });

        it('should handle APROBADO', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'APROBADO');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle PENDIENTE_APROBACION', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'PENDIENTE_APROBACION');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle RECHAZADO', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'RECHAZADO');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle CANCELADO', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'CANCELADO');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle ENVIADO with RETIRO', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'ENVIADO', 'RETIRO');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle ENVIADO with tracking code', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'ENVIADO', 'ENVIO', 'TRACK-1');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle ENVIADO without tracking code', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'ENVIADO', 'ENVIO');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle ENTREGADO', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'ENTREGADO');
            expect(mockSend).toHaveBeenCalled();
        });

        it('should handle unknown status', async () => {
            await service.sendStatusUpdate('user@test.com', 1, 'OTRO');
            expect(mockSend).toHaveBeenCalled();
        });
    });

    describe('sendAbandonedCartEmail', () => {
        it('should send with single product', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendAbandonedCartEmail('u@t.com', 'Juan', [{ nombre: 'GPU', precio: 1000, foto: 'http://img/1' }]);
            expect(result).toBe(true);
        });

        it('should send with multiple products', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            await service.sendAbandonedCartEmail('u@t.com', 'Juan', [
                { nombre: 'GPU', precio: 1500000, foto: '' },
                { nombre: 'RAM', precio: 50000, foto: '' }
            ]);
            expect(mockSend).toHaveBeenCalled();
        });
    });

    describe('sendStockAlertEmail', () => {
        it('should send stock alert', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendStockAlertEmail('u@t.com', 'RTX', 'http://link', 'http://foto', 1000);
            expect(result).toBe(true);
        });
    });

    describe('sendWelcomeEmail', () => {
        it('should send welcome email', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendWelcomeEmail('u@t.com', 'Juan');
            expect(result).toBe(true);
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should send password reset email', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendPasswordResetEmail('u@t.com', 'token123');
            expect(result).toBe(true);
        });
    });

    describe('sendContactConfirmationEmail', () => {
        it('should send contact confirmation with business hours', async () => {
            (prisma.configuracion.findFirst as any).mockResolvedValue({ horariosLocal: '9 a 18' });
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendContactConfirmationEmail('u@t.com', 'Juan');
            expect(result).toBe(true);
        });
    });

    describe('sendPriceDropNotification', () => {
        it('should send price drop notification', async () => {
            mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
            const result = await service.sendPriceDropNotification('u@t.com', 'RTX', 'http://l', 'http://f', 1500000, 1200000);
            expect(result).toBe(true);
        });
    });
});
