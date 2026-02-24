import { create } from './products.controller';
import { ProductService } from './products.service';
import { Request, Response } from 'express';
import { vi, describe, it, expect, beforeEach } from 'vitest';


vi.mock('./products.service');

describe('Products Controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
    });

    it('should parse string marcaId to number in create (FormData simulation)', async () => {
        mockReq = {
            body: {
                nombre: 'Test Product',
                descripcion: 'Detailed description for test product',
                precio: '1000',
                stock: '10',
                categoriaId: '1',
                marcaId: '5', 
                peso: '0.5',
                alto: '10',
                ancho: '10',
                profundidad: '10'
            },
            protocol: 'http',
            get: vi.fn(),
            file: undefined
        };

        
        const createSpy = vi.spyOn(ProductService.prototype, 'create').mockResolvedValue({ id: 1, nombre: 'Test Product' } as any);

        await create(mockReq as Request, mockRes as Response);

        
        if (statusMock.mock.calls.length === 0 && jsonMock.mock.calls.length > 0) {
            console.log('JSON response (failure):', jsonMock.mock.calls[0][0]);
        }

        expect(statusMock).toHaveBeenCalledWith(201);

        
        expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
            marcaId: 5, 
            precio: 1000,
            stock: 10
        }));
    });
});
