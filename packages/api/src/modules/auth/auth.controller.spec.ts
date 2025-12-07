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
            loginWithGoogle: vi.fn()
        };

        vi.doMock('./auth.service', () => ({
            AuthService: function () {
                return mockAuthService;
            }
        }));

        const controller = await import('./auth.controller');
        login = controller.login;
        register = controller.register;

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
});
