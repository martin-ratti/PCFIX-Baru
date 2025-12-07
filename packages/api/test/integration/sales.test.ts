import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createSale } from '../../src/modules/sales/sales.controller';

// Mock Auth Middleware
const mockAuth = (req: any, res: any, next: any) => {
    req.user = { id: 1 };
    next();
};

const app = express();
app.use(express.json());
app.post('/api/sales', mockAuth, createSale);

// Mock Service with Factory
vi.mock('../../src/modules/sales/sales.service', () => {
    const SalesService = vi.fn();
    SalesService.prototype.createSale = vi.fn().mockResolvedValue({ id: 123, status: 'PENDING' });
    return { SalesService };
});

describe('POST /api/sales', () => {
    it('should return 201 on success', async () => {
        const res = await request(app)
            .post('/api/sales')
            .send({
                items: [{ id: 1, quantity: 2 }],
                subtotal: 500,
                tipoEntrega: 'ENVIO',
                cpDestino: '1234',
                medioPago: 'TRANSFERENCIA'
            });

        if (res.status !== 201) {
            console.error('Test Failed Response:', JSON.stringify(res.body, null, 2));
        }

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(123);
    });

    it('should fail with 400 on bad payload', async () => {
        const res = await request(app)
            .post('/api/sales')
            .send({
                items: [] // Invalid min length
            });

        expect(res.status).toBe(400);
    });
});
