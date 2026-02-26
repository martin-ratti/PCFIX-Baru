import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
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
        sign: vi.fn().mockReturnValue('mock-jwt-token'),
    }
}));

const { mockVerifyIdToken } = vi.hoisted(() => ({
    mockVerifyIdToken: vi.fn()
}));

vi.mock('google-auth-library', () => ({
    OAuth2Client: class {
        verifyIdToken = mockVerifyIdToken;
    }
}));

vi.mock('../../shared/services/EmailService', () => ({
    EmailService: class {
        sendWelcomeEmail = vi.fn().mockResolvedValue(true);
        sendPasswordResetEmail = vi.fn().mockResolvedValue(true);
    }
}));

import { authService, AuthService } from './auth.service';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('should throw if user already exists', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1 });
            await expect(authService.register({ email: 'existing@test.com' })).rejects.toThrow('El usuario ya existe');
        });

        it('should register new user successfully', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            (bcrypt.hash as any).mockResolvedValue('hashed_pw');
            (prisma.user.create as any).mockResolvedValue({
                id: 1, email: 'new@test.com', nombre: 'Test', role: 'USER'
            });
            (prisma.cliente.create as any).mockResolvedValue({ id: 1 });

            const result = await authService.register({
                email: 'new@test.com',
                nombre: 'Test',
                apellido: 'User',
                password: 'password123',
                telefono: '123456'
            });

            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: 'new@test.com',
                    password: 'hashed_pw',
                    role: 'USER'
                })
            });
        });

        it('should register without optional telefono', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            (bcrypt.hash as any).mockResolvedValue('hashed_pw');
            (prisma.user.create as any).mockResolvedValue({
                id: 2, email: 'no-phone@test.com', nombre: 'Test', role: 'USER'
            });
            (prisma.cliente.create as any).mockResolvedValue({ id: 2 });

            const result = await authService.register({
                email: 'no-phone@test.com',
                nombre: 'Test',
                apellido: 'User',
                password: 'password123'
            });

            expect(result.user).toBeDefined();
        });
    });

    describe('login', () => {
        it('should throw if user not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            await expect(authService.login({ email: 'bad@test.com', password: 'pw' })).rejects.toThrow('Credenciales inválidas');
        });

        it('should throw if user has no password', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, password: null });
            await expect(authService.login({ email: 'google@test.com', password: 'pw' })).rejects.toThrow('Credenciales inválidas');
        });

        it('should throw if password is wrong', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, password: 'hashed' });
            (bcrypt.compare as any).mockResolvedValue(false);
            await expect(authService.login({ email: 'u@t.com', password: 'wrong' })).rejects.toThrow('Credenciales inválidas');
        });

        it('should login successfully', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, email: 'u@t.com', password: 'hashed', role: 'USER' });
            (bcrypt.compare as any).mockResolvedValue(true);

            const result = await authService.login({ email: 'u@t.com', password: 'correct' });
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
        });
    });

    describe('loginWithGoogle', () => {
        it('should throw if no email in payload', async () => {
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({ email: null })
            });

            await expect(authService.loginWithGoogle('bad-token')).rejects.toThrow('Token de Google inválido');
        });

        it('should create new user from Google', async () => {
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({ email: 'g@t.com', given_name: 'Google', family_name: 'User', sub: 'gid-123' })
            });

            (prisma.user.findUnique as any).mockResolvedValue(null);
            (prisma.user.create as any).mockResolvedValue({ id: 5, email: 'g@t.com', nombre: 'Google', role: 'USER' });
            (prisma.cliente.create as any).mockResolvedValue({ id: 5 });

            const result = await authService.loginWithGoogle('good-token');
            expect(result.user).toBeDefined();
        });

        it('should link Google to existing user without googleId', async () => {
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({ email: 'existing@t.com', sub: 'gid-456' })
            });

            (prisma.user.findUnique as any).mockResolvedValue({ id: 3, email: 'existing@t.com', googleId: null, role: 'USER' });
            (prisma.user.update as any).mockResolvedValue({});

            const result = await authService.loginWithGoogle('token');
            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { googleId: 'gid-456' }
            }));
        });

        it('should login existing Google user directly', async () => {
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({ email: 'google@t.com', sub: 'gid-789' })
            });

            (prisma.user.findUnique as any).mockResolvedValue({ id: 4, email: 'google@t.com', googleId: 'gid-789', role: 'USER' });

            const result = await authService.loginWithGoogle('token');
            expect(result.user).toBeDefined();
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('forgotPassword', () => {
        it('should return message even if user not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            const result = await authService.forgotPassword('noone@test.com');
            expect(result.message).toContain('Si el correo existe');
        });

        it('should send password reset email', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, email: 'u@t.com' });
            (prisma.user.update as any).mockResolvedValue({});
            const result = await authService.forgotPassword('u@t.com');
            expect(result.message).toBe('Correo enviado');
            expect(prisma.user.update).toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it('should throw on invalid token', async () => {
            (prisma.user.findFirst as any).mockResolvedValue(null);
            await expect(authService.resetPassword('bad-token', 'newpw')).rejects.toThrow('Token inválido o expirado');
        });

        it('should reset password successfully', async () => {
            (prisma.user.findFirst as any).mockResolvedValue({ id: 1 });
            (bcrypt.hash as any).mockResolvedValue('hashed_new');
            (prisma.user.update as any).mockResolvedValue({});

            const result = await authService.resetPassword('good-token', 'newpass');
            expect(result.message).toBe('Contraseña actualizada');
            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    password: 'hashed_new',
                    resetToken: null,
                    resetTokenExpires: null
                })
            }));
        });
    });

    describe('changePassword', () => {
        it('should throw if user not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            await expect(authService.changePassword(1, 'old', 'new')).rejects.toThrow('Usuario no encontrado');
        });

        it('should throw if current password wrong', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, password: 'hashed' });
            (bcrypt.compare as any).mockResolvedValue(false);
            await expect(authService.changePassword(1, 'wrong', 'new')).rejects.toThrow('La contraseña actual es incorrecta');
        });

        it('should change password', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 1, password: 'hashed' });
            (bcrypt.compare as any).mockResolvedValue(true);
            (bcrypt.hash as any).mockResolvedValue('new_hash');
            (prisma.user.update as any).mockResolvedValue({});

            const result = await authService.changePassword(1, 'correct', 'newpw');
            expect(result.message).toBe('Contraseña cambiada exitosamente');
        });
    });

    describe('deleteAccount', () => {
        it('should throw if active orders exist', async () => {
            (prisma.venta.count as any).mockResolvedValue(1);
            await expect(authService.deleteAccount(1)).rejects.toThrow('No puedes eliminar tu cuenta porque tienes pedidos en curso.');
        });

        it('should delete account if no active orders', async () => {
            (prisma.venta.count as any).mockResolvedValue(0);
            (prisma.user.delete as any).mockResolvedValue({ id: 1 });
            const result = await authService.deleteAccount(1);
            expect(result.message).toBe('Cuenta eliminada correctamente');
        });
    });

    describe('generateToken', () => {
        it('should generate JWT token', () => {
            const token = (authService as any).generateToken({ id: 1, email: 'u@t.com', role: 'USER' });
            expect(token).toBe('mock-jwt-token');
        });
    });
});
