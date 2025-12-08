import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    configuracion: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

vi.mock('axios', () => ({
    default: {
        get: vi.fn()
    }
}));

import { ConfigService } from './config.service';
import axios from 'axios';

describe('ConfigService', () => {
    let service: ConfigService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ConfigService();
    });

    describe('getConfig', () => {
        it('should return existing config when found', async () => {
            const mockConfig = {
                id: 1,
                nombreBanco: 'Test Bank',
                cotizacionUsdt: 1200
            };
            mockPrisma.configuracion.findFirst.mockResolvedValue(mockConfig);

            const result = await service.getConfig();

            expect(result).toEqual(mockConfig);
            expect(mockPrisma.configuracion.findFirst).toHaveBeenCalled();
            expect(mockPrisma.configuracion.create).not.toHaveBeenCalled();
        });

        it('should create default config when none exists', async () => {
            const defaultConfig = {
                id: 1,
                nombreBanco: "Banco Nación",
                titular: "PCFIX S.A.",
                cbu: "0000000000000000000000",
                alias: "PCFIX.VENTAS",
                costoEnvioFijo: 6500,
                cotizacionUsdt: 1200
            };
            mockPrisma.configuracion.findFirst.mockResolvedValue(null);
            mockPrisma.configuracion.create.mockResolvedValue(defaultConfig);

            const result = await service.getConfig();

            expect(result).toEqual(defaultConfig);
            expect(mockPrisma.configuracion.create).toHaveBeenCalled();
        });
    });

    describe('updateConfig', () => {
        it('should update config with provided data', async () => {
            const currentConfig = { id: 1, nombreBanco: 'Old Bank' };
            const updateData = { nombreBanco: 'New Bank' };
            const updatedConfig = { id: 1, nombreBanco: 'New Bank' };

            mockPrisma.configuracion.findFirst.mockResolvedValue(currentConfig);
            mockPrisma.configuracion.update.mockResolvedValue(updatedConfig);

            const result = await service.updateConfig(updateData);

            expect(result).toEqual(updatedConfig);
            expect(mockPrisma.configuracion.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData
            });
        });
    });

    describe('syncUsdtPrice', () => {
        it('should update USDT price from external API', async () => {
            const mockResponse = {
                data: { binancep2p: { ask: 1250.50 } }
            };
            const mockConfig = { id: 1, cotizacionUsdt: 1200 };
            const updatedConfig = { id: 1, cotizacionUsdt: 1250.5 };

            (axios.get as any).mockResolvedValue(mockResponse);
            mockPrisma.configuracion.findFirst.mockResolvedValue(mockConfig);
            mockPrisma.configuracion.update.mockResolvedValue(updatedConfig);

            const result = await service.syncUsdtPrice();

            expect(result).toEqual(updatedConfig);
            expect(axios.get).toHaveBeenCalledWith('https://criptoya.com/api/usdt/ars/0.1');
        });

        it('should throw error when price is invalid', async () => {
            const mockResponse = {
                data: { binancep2p: { ask: NaN } }
            };
            (axios.get as any).mockResolvedValue(mockResponse);

            await expect(service.syncUsdtPrice()).rejects.toThrow();
        });

        it('should return null when no config exists', async () => {
            const mockResponse = {
                data: { binancep2p: { ask: 1250 } }
            };
            (axios.get as any).mockResolvedValue(mockResponse);
            mockPrisma.configuracion.findFirst.mockResolvedValue(null);

            const result = await service.syncUsdtPrice();

            expect(result).toBeNull();
        });
    });
});
