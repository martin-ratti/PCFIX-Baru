import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        configuracion: {
            findFirst: vi.fn()
        }
    }
}));

import { ShippingService, PROVINCIAS_ARGENTINAS } from './ShippingService';
import { prisma } from '../../shared/database/prismaClient';

describe('ShippingService', () => {
    let service: ShippingService;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ZIPPIN_CLIENT_ID = 'test-id';
        process.env.ZIPPIN_CLIENT_SECRET = 'test-secret';
        process.env.ZIPPIN_ACCOUNT_ID = 'acc-123';
        process.env.ZIPPIN_SANDBOX = 'true';
        process.env.ZIPPIN_SUCURSAL_ID = '1';
        service = new ShippingService();
    });

    describe('PROVINCIAS_ARGENTINAS', () => {
        it('should export 24 provinces', () => {
            expect(PROVINCIAS_ARGENTINAS).toHaveLength(24);
            expect(PROVINCIAS_ARGENTINAS).toContain('Buenos Aires');
            expect(PROVINCIAS_ARGENTINAS).toContain('CABA');
        });
    });

    describe('constructor', () => {
        it('should use sandbox URL when ZIPPIN_SANDBOX is true', () => {
            expect((service as any).baseUrl).toBe('https://api-sandbox.zipnova.com.ar/v2');
        });

        it('should use production URL when ZIPPIN_SANDBOX is not true', () => {
            process.env.ZIPPIN_SANDBOX = 'false';
            const prodService = new ShippingService();
            expect((prodService as any).baseUrl).toBe('https://api.zipnova.com.ar/v2');
        });

        it('should set originId from env', () => {
            expect((service as any).originId).toBe(1);
        });

        it('should leave originId null when not set', () => {
            delete process.env.ZIPPIN_SUCURSAL_ID;
            const s = new ShippingService();
            expect((s as any).originId).toBeNull();
        });
    });

    describe('isSandboxMode', () => {
        it('should return true in sandbox', () => {
            expect(service.isSandboxMode()).toBe(true);
        });
    });

    describe('isConfigured', () => {
        it('should return true when all vars set', () => {
            expect(service.isConfigured()).toBe(true);
        });

        it('should return false when apiToken missing', () => {
            delete process.env.ZIPPIN_CLIENT_ID;
            const s = new ShippingService();
            expect(s.isConfigured()).toBe(false);
        });
    });

    describe('getOriginId (private)', () => {
        it('should throw when originId not set', () => {
            delete process.env.ZIPPIN_SUCURSAL_ID;
            const s = new ShippingService();
            expect(() => (s as any).getOriginId()).toThrow('ZIPPIN_SUCURSAL_ID no configurado');
        });

        it('should return originId when set', () => {
            expect((service as any).getOriginId()).toBe(1);
        });
    });

    describe('calculateCost', () => {
        it('should return default 6500 when no apiToken', async () => {
            delete process.env.ZIPPIN_CLIENT_ID;
            const s = new ShippingService();
            const cost = await s.calculateCost('2000', [{ weight: 1, height: 10, width: 10, depth: 10, quantity: 1 }]);
            expect(cost).toBe(6500);
        });

        it('should return cheapest price from API response', async () => {
            (axios.post as any).mockResolvedValue({
                data: {
                    all_results: [
                        { selectable: true, carrier: { name: 'OCA' }, amounts: { price_incl_tax: 8000, price: 7000 } },
                        { selectable: true, carrier: { name: 'Correo Argentino' }, amounts: { price_incl_tax: 5000, price: 4500 } }
                    ]
                }
            });
            const cost = await service.calculateCost('2000', [{ weight: 2, height: 15, width: 30, depth: 10, quantity: 1 }]);
            expect(cost).toBe(5000);
        });

        it('should prefer Correo Argentino options', async () => {
            (axios.post as any).mockResolvedValue({
                data: {
                    all_results: [
                        { selectable: true, carrier: { name: 'Correo Argentino Clasico' }, amounts: { price_incl_tax: 6000 } },
                        { selectable: true, carrier: { name: 'Correo Argentino Express' }, amounts: { price_incl_tax: 9000 } },
                        { selectable: true, carrier: { name: 'OCA Cheapest' }, amounts: { price_incl_tax: 3000 } }
                    ]
                }
            });
            const cost = await service.calculateCost('2000', [{ weight: 1, height: 10, width: 10, depth: 10, quantity: 1 }]);
            expect(cost).toBe(6000);
        });

        it('should throw when no selectable options', async () => {
            (axios.post as any).mockResolvedValue({
                data: { all_results: [{ selectable: false, amounts: { price: 5000 } }] }
            });
            vi.spyOn(console, 'error').mockImplementation(() => { });
            (prisma.configuracion.findFirst as any).mockResolvedValue({ costoEnvioFijo: 7000 });
            const cost = await service.calculateCost('2000', [{ weight: 1, height: 10, width: 10, depth: 10, quantity: 1 }]);
            expect(cost).toBe(7000);
        });

        it('should throw when no results returned', async () => {
            (axios.post as any).mockResolvedValue({ data: { all_results: [] } });
            vi.spyOn(console, 'error').mockImplementation(() => { });
            (prisma.configuracion.findFirst as any).mockResolvedValue({ costoEnvioFijo: 7000 });
            const cost = await service.calculateCost('2000', [{ weight: 1, height: 10, width: 10, depth: 10, quantity: 1 }]);
            expect(cost).toBe(7000);
        });

        it('should fallback to fixed cost on API error', async () => {
            (axios.post as any).mockRejectedValue(new Error('Network error'));
            vi.spyOn(console, 'error').mockImplementation(() => { });
            (prisma.configuracion.findFirst as any).mockResolvedValue({ costoEnvioFijo: 8000 });
            const cost = await service.calculateCost('2000', [{ weight: 1, height: 10, width: 10, depth: 10, quantity: 1 }]);
            expect(cost).toBe(8000);
        });

        it('should handle items with zero dimensions', async () => {
            (axios.post as any).mockResolvedValue({
                data: {
                    all_results: [
                        { selectable: true, carrier: { name: 'Carrier' }, amounts: { price_incl_tax: 5000 } }
                    ]
                }
            });
            const cost = await service.calculateCost('2000', [{ weight: 0, height: 0, width: 0, depth: 0, quantity: 2 }]);
            expect(cost).toBe(5000);
        });
    });

    describe('createShipment', () => {
        it('should throw when no credentials', async () => {
            delete process.env.ZIPPIN_CLIENT_ID;
            const s = new ShippingService();
            await expect(s.createShipment([], { direccion: 'Test', ciudad: 'Test', provincia: 'Test', codigoPostal: '2000' }, 10000)).rejects.toThrow('Credenciales Zipnova no configuradas');
        });

        it('should create shipment successfully', async () => {
            (axios.post as any).mockResolvedValue({
                data: {
                    data: {
                        id: 'SHIP-1',
                        tracking_id: 'TRACK-1',
                        label_url: 'http://label.com/1',
                        logistic_type: 'Correo Argentino'
                    }
                }
            });

            const result = await service.createShipment(
                [{ weight: 2, height: 15, width: 30, depth: 10, quantity: 1, description: 'GPU', sku: 'GPU-001' }],
                { direccion: 'Calle 123', ciudad: 'Rosario', provincia: 'Santa Fe', codigoPostal: '2000', nombre: 'Juan', documento: '12345678', email: 'j@t.com', telefono: '123', piso: '2A' },
                150000,
                'EXT-1'
            );

            expect(result.shipmentId).toBe('SHIP-1');
            expect(result.trackingCode).toBe('TRACK-1');
            expect(result.labelUrl).toBe('http://label.com/1');
        });

        it('should handle missing optional fields in destination', async () => {
            (axios.post as any).mockResolvedValue({
                data: { data: { id: 'SHIP-2', tracking_code: 'TC2', carrier: 'OCA' } }
            });

            const result = await service.createShipment(
                [{ weight: 1, height: 0, width: 0, depth: 0, quantity: 1 }],
                { direccion: '', ciudad: '', provincia: '', codigoPostal: '' },
                5000
            );

            expect(result.shipmentId).toBe('SHIP-2');
        });

        it('should throw on API error with message', async () => {
            (axios.post as any).mockRejectedValue({
                response: { data: { message: 'Invalid zipcode' } }
            });
            vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(service.createShipment(
                [{ weight: 1, height: 10, width: 10, depth: 10, quantity: 1 }],
                { direccion: 'Test', ciudad: 'Test', provincia: 'Test', codigoPostal: '2000' },
                10000
            )).rejects.toThrow('Invalid zipcode');
        });

        it('should throw on API error with errors object', async () => {
            (axios.post as any).mockRejectedValue({
                response: { data: { errors: { zipcode: ['Zip code is required'] } } }
            });
            vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(service.createShipment(
                [{ weight: 1, height: 10, width: 10, depth: 10, quantity: 1 }],
                { direccion: 'Test', ciudad: 'Test', provincia: 'Test', codigoPostal: '' },
                10000
            )).rejects.toThrow('Zip code is required');
        });
    });

    describe('getLabel', () => {
        it('should return label URL', async () => {
            (axios.get as any).mockResolvedValue({ data: { data: { url: 'http://label.com/1.pdf' } } });
            const url = await service.getLabel('SHIP-1');
            expect(url).toBe('http://label.com/1.pdf');
        });

        it('should return url from data root', async () => {
            (axios.get as any).mockResolvedValue({ data: { url: 'http://label.com/2.pdf' } });
            const url = await service.getLabel('SHIP-2');
            expect(url).toBe('http://label.com/2.pdf');
        });

        it('should throw on error', async () => {
            (axios.get as any).mockRejectedValue(new Error('Fail'));
            vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(service.getLabel('BAD')).rejects.toThrow('No se pudo obtener la etiqueta de envío');
        });
    });

    describe('getTrackingInfo', () => {
        it('should return tracking info', async () => {
            (axios.get as any).mockResolvedValue({
                data: {
                    data: {
                        status: 'in_transit',
                        status_description: 'En camino',
                        tracking_id: 'TRACK-1',
                        logistic_type: 'CA',
                        estimated_delivery_date: '2025-01-15',
                        tracking_events: [{ event: 'picked_up' }]
                    }
                }
            });
            const info = await service.getTrackingInfo('SHIP-1');
            expect(info.status).toBe('in_transit');
            expect(info.trackingCode).toBe('TRACK-1');
            expect(info.events).toHaveLength(1);
        });

        it('should throw on error', async () => {
            (axios.get as any).mockRejectedValue(new Error('Network'));
            vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(service.getTrackingInfo('BAD')).rejects.toThrow('No se pudo consultar el estado del envío');
        });
    });

    describe('cancelShipment', () => {
        it('should return true on success', async () => {
            (axios.delete as any).mockResolvedValue({});
            const result = await service.cancelShipment('SHIP-1');
            expect(result).toBe(true);
        });

        it('should return false on error', async () => {
            (axios.delete as any).mockRejectedValue(new Error('Fail'));
            vi.spyOn(console, 'error').mockImplementation(() => { });
            const result = await service.cancelShipment('BAD');
            expect(result).toBe(false);
        });
    });
});
