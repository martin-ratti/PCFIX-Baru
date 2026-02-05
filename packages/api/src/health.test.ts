import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from './server';

describe('Health Check Endpoint', () => {
    it('should return 200 OK', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'API is healthy');
    });
});
