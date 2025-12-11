import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

describe('Auth Controller', () => {
    let login: any;
    let register: any;
    let mockAuthService: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any;
    let status: any;

    beforeEach(async () => {
        vi.resetModules();

        mockAuthService = {
            login: vi.fn(),
            register: vi.fn(),
            loginWithGoogle: vi.fn(),
            changePassword: vi.fn()
        };

        vi.doMock('./auth.service', () => ({
            AuthService: function () {
                return mockAuthService;
            },
            authService: mockAuthService // Also mock the instance export if that's what is used
        }));

        const controller = await import('./auth.controller');
        login = controller.login;
        register = controller.register;
        // @ts-ignore
        const changePassword = controller.changePassword; // Retrieve new controller

        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { status, json };
        req = { body: {} } as any;
    });

    describe('login', () => {
        it('should reject missing credentials', async () => {
            req.body = { email: 'test@test.com' };
            await login(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });

        it('should call service login on valid input', async () => {
            req.body = { email: 'test@test.com', password: 'Password123!' };

            mockAuthService.login.mockResolvedValue({ token: 'abc', user: { id: 1 } });

            await login(req as Request, res as Response);

            expect(mockAuthService.login).toHaveBeenCalled();
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('register', () => {
        it('should reject weak password', async () => {
            req.body = {
                email: 'new@test.com',
                password: '123',
                nombre: 'Pepe',
                apellido: 'Gomez'
            };
            await register(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400);
        });
    });

    describe('changePassword', () => {
        let changePassword: any;
        beforeEach(async () => {
            const controller = await import('./auth.controller');
            changePassword = controller.changePassword;
        });

        it('should reject unauthorized if no user', async () => {
            (req as any).user = undefined;

            await changePassword(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(401);
        });

        it('should validate inputs', async () => {
            (req as any).user = { id: 1 };
            req.body = { currentPassword: '', newPassword: '123' };

            await changePassword(req as Request, res as Response);
            expect(status).toHaveBeenCalledWith(400); // Validation error
        });

        it('should call service changePassword', async () => {
            (req as any).user = { id: 1 };
            req.body = { currentPassword: 'password', newPassword: 'newpassword123' };
            mockAuthService.changePassword.mockResolvedValue({ message: 'ok' });

            await changePassword(req as Request, res as Response);

            expect(mockAuthService.changePassword).toHaveBeenCalledWith(1, 'password', 'newpassword123');
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
