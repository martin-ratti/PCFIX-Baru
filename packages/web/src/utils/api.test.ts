import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchApi } from './api';

// Mock global fetch
global.fetch = vi.fn();

describe('fetchApi utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls fetch with correct URL', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        });

        await fetchApi('/products');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3002/api/products',
            expect.any(Object)
        );
    });

    it('passes options to fetch', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200
        });

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        };

        await fetchApi('/test', options);

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3002/api/test',
            options
        );
    });

    it('returns response for successful requests', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: 'test' })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchApi('/test');

        expect(result).toBe(mockResponse);
    });

    it('throws error for 5xx server errors', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 500
        });

        await expect(fetchApi('/test')).rejects.toThrow('Error del servidor (500)');
    });

    it('returns response for 4xx client errors (handled by caller)', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            json: async () => ({ success: false, error: 'Bad Request' })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await fetchApi('/test');

        // 4xx errors are returned, not thrown
        expect(result.status).toBe(400);
    });
});
