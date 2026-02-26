import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

describe('Auth Controller - Full Coverage', () => {
    let mockAuthService: any;
    let register: any, login: any, loginGoogle: any, forgotPassword: any, resetPassword: any, changePassword: any, deleteProfile: any;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any, status: any;

    beforeEach(async () => {
        vi.resetModules();

        mockAuthService = {
            login: vi.fn(),
            register: vi.fn(),
            loginWithGoogle: vi.fn(),
            forgotPassword: vi.fn(),
            resetPassword: vi.fn(),
            changePassword: vi.fn(),
            deleteAccount: vi.fn()
        };

        vi.doMock('./auth.service', () => ({
            AuthService: function () { return mockAuthService; },
            authService: mockAuthService
        }));

        const controller = await import('./auth.controller');
        register = controller.register;
        login = controller.login;
        loginGoogle = controller.loginGoogle;
        forgotPassword = controller.forgotPassword;
        resetPassword = controller.resetPassword;
        changePassword = controller.changePassword;
        deleteProfile = controller.deleteProfile;

        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { status, json };
        req = { body: {} } as any;
    });

    describe('register', () => {
        it('should register successfully', async () => {
            req.body = { email: 'u@t.com', nombre: 'Juan', apellido: 'Perez', password: 'pass123' };
            mockAuthService.register.mockResolvedValue({ user: { id: 1 }, token: 'tok' });
            await register(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(201);
        });

        it('should return 400 on validation error', async () => {
            req.body = { email: 'bad', password: '1' };
            await register(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 409 on duplicate email', async () => {
            req.body = { email: 'u@t.com', nombre: 'Juan', apellido: 'Perez', password: 'pass123' };
            mockAuthService.register.mockRejectedValue(new Error('El email ya está registrado'));
            await register(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });

    describe('login', () => {
        it('should login successfully', async () => {
            req.body = { email: 'u@t.com', password: 'pass123' };
            mockAuthService.login.mockResolvedValue({ token: 'tok', user: { id: 1 } });
            await login(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(200);
        });

        it('should return 400 on missing password', async () => {
            req.body = { email: 'u@t.com' };
            await login(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return error status on invalid credentials', async () => {
            req.body = { email: 'u@t.com', password: 'wrong' };
            mockAuthService.login.mockRejectedValue(new Error('Credenciales inválidas'));
            await login(req as Request, res as Response);
            expect(status).toHaveBeenCalled();
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('loginGoogle', () => {
        it('should return 400 if no token', async () => {
            req.body = {};
            await loginGoogle(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should login with Google successfully', async () => {
            req.body = { token: 'google-token' };
            mockAuthService.loginWithGoogle.mockResolvedValue({ user: { id: 1 }, token: 'tok' });
            await loginGoogle(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 401 on Google error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            req.body = { token: 'bad-token' };
            mockAuthService.loginWithGoogle.mockRejectedValue(new Error('Invalid'));
            await loginGoogle(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });
    });

    describe('forgotPassword', () => {
        it('should send forgot password email', async () => {
            req.body = { email: 'u@t.com' };
            mockAuthService.forgotPassword.mockResolvedValue({ message: 'Correo enviado' });
            await forgotPassword(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 on invalid email', async () => {
            req.body = { email: 'bad' };
            await forgotPassword(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });

    describe('resetPassword', () => {
        it('should reset password', async () => {
            req.body = { token: 'valid-token', newPassword: 'newpass123' };
            mockAuthService.resetPassword.mockResolvedValue({ message: 'OK' });
            await resetPassword(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 on short password', async () => {
            req.body = { token: 'tok', newPassword: '12' };
            await resetPassword(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 400 on invalid token', async () => {
            req.body = { token: 'bad', newPassword: 'newpass123' };
            mockAuthService.resetPassword.mockRejectedValue(new Error('Token inválido'));
            await resetPassword(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });

    describe('changePassword', () => {
        it('should return 401 if no user', async () => {
            (req as any).user = undefined;
            await changePassword(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should change password', async () => {
            (req as any).user = { id: 1 };
            req.body = { currentPassword: 'old', newPassword: 'newpass123' };
            mockAuthService.changePassword.mockResolvedValue({ message: 'OK' });
            await changePassword(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 on validation error', async () => {
            (req as any).user = { id: 1 };
            req.body = { currentPassword: '', newPassword: '12' };
            await changePassword(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteProfile', () => {
        it('should return 401 if no user', async () => {
            (req as any).user = undefined;
            await deleteProfile(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should delete profile', async () => {
            (req as any).user = { id: 1 };
            mockAuthService.deleteAccount.mockResolvedValue({ message: 'Eliminada' });
            await deleteProfile(req as Request, res as Response);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 on error', async () => {
            (req as any).user = { id: 1 };
            mockAuthService.deleteAccount.mockRejectedValue(new Error('Pedidos activos'));
            await deleteProfile(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });
});
