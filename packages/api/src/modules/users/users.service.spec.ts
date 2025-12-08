import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        update: vi.fn()
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

import { UserService } from './users.service';

describe('UserService', () => {
    let service: UserService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new UserService();
    });

    describe('findById', () => {
        it('should return user by id with selected fields', async () => {
            const mockUser = {
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
                email: 'juan@test.com',
                role: 'USER',
                createdAt: new Date()
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.findById(1);

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            });
            expect(result).toEqual(mockUser);
        });

        it('should return null for non-existent user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await service.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update user name', async () => {
            const updatedUser = {
                id: 1,
                nombre: 'Carlos',
                apellido: 'García',
                email: 'carlos@test.com',
                role: 'USER'
            };
            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const result = await service.update(1, { nombre: 'Carlos', apellido: 'García' });

            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { nombre: 'Carlos', apellido: 'García' },
                select: { id: true, nombre: true, apellido: true, email: true, role: true }
            });
            expect(result).toEqual(updatedUser);
        });
    });
});
