import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
const mockPaymentGet = vi.fn();

vi.mock('mercadopago', () => ({
    MercadoPagoConfig: class {
        constructor() { }
    },
    Preference: class {
        create = mockCreate;
    }
}));

import { MercadoPagoService } from './MercadoPagoService';

describe('MercadoPagoService', () => {
    let service: MercadoPagoService;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.MP_ACCESS_TOKEN = 'test-token';
        process.env.API_URL = 'http://localhost:3002';
        delete process.env.RAILWAY_PUBLIC_DOMAIN;
        service = new MercadoPagoService();
    });

    describe('constructor', () => {
        it('should warn when MP_ACCESS_TOKEN is not defined', () => {
            delete process.env.MP_ACCESS_TOKEN;
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            new MercadoPagoService();
            expect(spy).toHaveBeenCalledWith('MP_ACCESS_TOKEN is not defined');
            spy.mockRestore();
        });
    });

    describe('createPreference', () => {
        it('should create preference successfully', async () => {
            mockCreate.mockResolvedValue({ init_point: 'https://mp.com/pay/123' });
            const items = [{ id: '1', title: 'Product', quantity: 1, unit_price: 1000, currency_id: 'ARS' }];
            const result = await service.createPreference(1, items, 'user@test.com');
            expect(result).toBe('https://mp.com/pay/123');
        });

        it('should add shipping cost item when > 0', async () => {
            mockCreate.mockResolvedValue({ init_point: 'url' });
            const items = [{ id: '1', title: 'P', quantity: 1, unit_price: 1000 }];
            await service.createPreference(1, items, 'u@t.com', 500);
            const callBody = mockCreate.mock.calls[0][0].body;
            expect(callBody.items).toHaveLength(2);
            expect(callBody.items[1]).toEqual(expect.objectContaining({ id: 'shipping', unit_price: 500 }));
        });

        it('should not add shipping when cost is 0', async () => {
            mockCreate.mockResolvedValue({ init_point: 'url' });
            await service.createPreference(1, [{ id: '1', title: 'P', quantity: 1, unit_price: 100 }], 'u@t.com', 0);
            const callBody = mockCreate.mock.calls[0][0].body;
            expect(callBody.items).toHaveLength(1);
        });

        it('should set notification_url in production', async () => {
            process.env.API_URL = 'https://api.pcfixbaru.com.ar';
            service = new MercadoPagoService();
            mockCreate.mockResolvedValue({ init_point: 'url' });
            await service.createPreference(1, [], 'u@t.com');
            const callBody = mockCreate.mock.calls[0][0].body;
            expect(callBody.notification_url).toBe('https://api.pcfixbaru.com.ar/api/sales/webhook');
        });

        it('should not set notification_url in localhost', async () => {
            mockCreate.mockResolvedValue({ init_point: 'url' });
            await service.createPreference(1, [], 'u@t.com');
            const callBody = mockCreate.mock.calls[0][0].body;
            expect(callBody.notification_url).toBeUndefined();
        });

        it('should use RAILWAY_PUBLIC_DOMAIN as fallback', async () => {
            delete process.env.API_URL;
            process.env.RAILWAY_PUBLIC_DOMAIN = 'myapp.railway.app';
            service = new MercadoPagoService();
            mockCreate.mockResolvedValue({ init_point: 'url' });
            await service.createPreference(1, [], 'u@t.com');
            const callBody = mockCreate.mock.calls[0][0].body;
            expect(callBody.back_urls.success).toContain('myapp.railway.app');
        });

        it('should throw on API error', async () => {
            mockCreate.mockRejectedValue(new Error('API Error'));
            vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(service.createPreference(1, [], 'u@t.com')).rejects.toThrow('Could not create Mercado Pago preference');
        });
    });

    describe('getPayment', () => {
        it('should throw on error', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(service.getPayment('bad-id')).rejects.toThrow();
        });
    });
});
