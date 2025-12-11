import { describe, it, expect, vi, afterEach } from 'vitest';
import { authService } from './auth.service';
import { prisma } from '../../shared/database/prismaClient';

// Mock dependencies
vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        cliente: {
            create: vi.fn(),
        },
        venta: {
            count: vi.fn(),
        },
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    }
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(),
    }
}));

vi.mock('../../shared/services/EmailService', () => {
    const EmailService = vi.fn();
    EmailService.prototype.sendWelcomeEmail = vi.fn();
    EmailService.prototype.sendPasswordResetEmail = vi.fn();
    return { EmailService };
});

describe('AuthService', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('deleteAccount', () => {
        it('should throw error if user has active orders', async () => {
            // Mock active order count > 0
            (prisma.venta.count as any).mockResolvedValue(1);

            await expect(authService.deleteAccount(1)).rejects.toThrow(
                'No puedes eliminar tu cuenta porque tienes pedidos en curso.'
            );

            expect(prisma.venta.count).toHaveBeenCalledWith({
                where: {
                    cliente: { userId: 1 },
                    estado: {
                        in: ['PENDIENTE_PAGO', 'PENDIENTE_APROBACION', 'APROBADO', 'ENVIADO'],
                    },
                },
            });
            expect(prisma.user.delete).not.toHaveBeenCalled();
        });

        it('should delete user if no active orders', async () => {
            // Mock active order count = 0
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.user.delete as any).mockResolvedValue({ id: 1 });

            const result = await authService.deleteAccount(1);

            expect(prisma.venta.count).toHaveBeenCalled();
            expect(prisma.user.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual({ message: 'Cuenta eliminada correctamente' });
        });
    });

    describe('changePassword', () => {
        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            await expect(authService.changePassword(1, 'old', 'new')).rejects.toThrow('Usuario no encontrado');
        });

        it('should throw error if current password is wrong', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, password: 'hashed_real_password' });
            const bcrypt = await import('bcryptjs');
            (bcrypt.default.compare as any).mockResolvedValue(false);

            await expect(authService.changePassword(1, 'wrong', 'new')).rejects.toThrow('La contraseña actual es incorrecta');
        });

        it('should update password if valid', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, password: 'hashed_real_password' });
            const bcrypt = await import('bcryptjs');
            (bcrypt.default.compare as any).mockResolvedValue(true);
            (bcrypt.default.hash as any).mockResolvedValue('hashed_new_password');

            const result = await authService.changePassword(1, 'old', 'new');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { password: 'hashed_new_password' }
            });
            expect(result).toEqual({ message: 'Contraseña cambiada exitosamente' });
        });
    });
});
