import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as UsersController from './users.controller';
import { UserService } from './users.service';

vi.mock('./users.service');

describe('UsersController', () => {
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

    describe('getProfile', () => {
        it('should return user profile', async () => {
            req.params = { id: '1' };
            const user = { id: 1, email: 'test@test.com' };
            vi.spyOn(UserService.prototype, 'findById').mockResolvedValue(user as any);

            await UsersController.getProfile(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: user });
        });

        it('should return 404 if not found', async () => {
            req.params = { id: '1' };
            vi.spyOn(UserService.prototype, 'findById').mockResolvedValue(null);

            await UsersController.getProfile(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updateProfile', () => {
        it('should update profile successfully', async () => {
            req.params = { id: '1' };
            req.body = { nombre: 'John', apellido: 'Doe' };
            const updated = { id: 1, nombre: 'John' };
            vi.spyOn(UserService.prototype, 'update').mockResolvedValue(updated as any);

            await UsersController.updateProfile(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: updated, message: 'Perfil actualizado correctamente' });
        });

        it('should return 400 for validation errors', async () => {
            req.params = { id: '1' };
            req.body = { nombre: 'J' }; // Too short

            await UsersController.updateProfile(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
