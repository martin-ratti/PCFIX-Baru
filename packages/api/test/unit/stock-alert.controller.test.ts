import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { subscribeToStockAlert } from '../../src/modules/products/stock-alert.controller';

// Mock DB and Service
vi.mock('../../src/shared/database/prismaClient', () => ({
    prisma: {
        stockAlert: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        producto: {
            findUnique: vi.fn(),
        }
    }
}));

const app = express();
app.use(express.json());
app.post('/api/products/alert/subscribe', subscribeToStockAlert);

describe('POST /api/products/alert/subscribe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if email or productId is missing', async () => {
        const res = await request(app)
            .post('/api/products/alert/subscribe')
            .send({ email: '' }); // Missing product

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 on successful subscription', async () => {
        // Mock Prisma findFirst to return null (no existing alert)
        // Mock Prisma create to return new alert
        // Mock Producto findUnique to return exists

        // Note: In unit test with mocked controller dependencies, we might not reach full service logic if service is imported.
        // If controller calls service, we should mock service.
        // Assuming controller uses service:
        // We will mock the service in next steps if needed, but if controller imports directly from service file, we need to mock that file.
    });
});
