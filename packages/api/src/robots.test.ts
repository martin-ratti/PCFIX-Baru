
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from './server';

describe('Robots.txt Endpoint', () => {
    it('should return 200 OK and correct content', async () => {
        const response = await request(app).get('/robots.txt');
        expect(response.status).toBe(200);
        expect(response.type).toBe('text/plain');
        expect(response.text).toContain('User-agent: *');
        expect(response.text).toContain('Disallow: /');
    });
});
