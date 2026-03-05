import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';
import { z } from 'zod';
import { SalesService } from './sales.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';
import { VentaEstado } from '@prisma/client';

const service = new SalesService();


export const quoteShipping = async (req: Request, res: Response) => {
    try {
        const { zipCode, items } = req.body;
        if (!zipCode) return res.status(400).json({ success: false, error: 'CP requerido' });
        if (!items || !Array.isArray(items)) return res.status(400).json({ success: false, error: "Items inválidos" });

        const cost = await service.getQuote(zipCode, items);
        return res.json({ success: true, data: { cost } });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

const createSaleSchema = z.object({
    items: z.array(z.object({
        id: z.string().or(z.number()),
        quantity: z.number().min(1)
    })).min(1),
    subtotal: z.number().min(0),
    cpDestino: z.string().min(4).optional(),
    tipoEntrega: z.enum(['ENVIO', 'RETIRO']),
    medioPago: z.enum(['MERCADOPAGO', 'EFECTIVO', 'VIUMI', 'TRANSFERENCIA', 'BINANCE']),

    direccionEnvio: z.string().optional(),
    ciudadEnvio: z.string().optional(),
    provinciaEnvio: z.string().optional(),
    telefonoEnvio: z.string().optional(),
    documentoEnvio: z.string().optional()
});

export const createSale = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const data = createSaleSchema.parse(req.body);

        const sale = await service.createSale(
            userId,
            data.items,
            data.subtotal,
            data.cpDestino,
            data.tipoEntrega,
            data.medioPago,
            {
                direccion: data.direccionEnvio,
                ciudad: data.ciudadEnvio,
                provincia: data.provinciaEnvio,
                telefono: data.telefonoEnvio,
                documento: data.documentoEnvio
            }
        );
        res.status(201).json({ success: true, data: sale });
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Datos de venta inválidos', details: e.errors });
        }

        if (e.message.includes('no encontrado') || e.message.includes('Stock insuficiente')) {
            return res.status(400).json({ success: false, error: e.message });
        }
        res.status(500).json({ success: false, error: e.message });
    }
};





import { MercadoPagoService } from '../../shared/services/MercadoPagoService';
const mpService = new MercadoPagoService();

export const createMPPreference = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sale = await service.findById(Number(id));
        if (!sale) return res.status(404).json({ success: false, error: 'Venta no encontrada' });

        const items: any[] = sale.lineasVenta.map((line: any) => {
            const unitPrice = Number(line.subTotal) / Number(line.cantidad);
            return {
                id: String(line.productoId),
                title: line.producto.nombre || 'Producto',
                quantity: Number(line.cantidad),
                unit_price: Number(unitPrice.toFixed(2)),
                currency_id: 'ARS'
            };
        });

        const costoEnvioNum = sale.tipoEntrega === 'ENVIO' ? Number(sale.costoEnvio ?? 0) : 0;
        const payerEmail = sale.cliente?.user?.email || 'test_user_123456@testuser.com';
        const link = await mpService.createPreference(Number(id), items, payerEmail, costoEnvioNum);
        res.json({ success: true, data: { url: link } });
    } catch (e: any) {
        console.error('[MP] Error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
};

const createManualSaleSchema = z.object({
    customerEmail: z.string().email(),
    items: z.array(z.object({
        id: z.number(),
        quantity: z.number().min(1),
        customPrice: z.number().min(0).optional(),
        customDescription: z.string().optional()
    })).min(1),
    medioPago: z.enum(['MERCADOPAGO', 'EFECTIVO', 'VIUMI', 'TRANSFERENCIA', 'BINANCE']),
    estado: z.enum(['PENDIENTE_PAGO', 'PENDIENTE_APROBACION', 'APROBADO', 'ENVIADO', 'ENTREGADO', 'RECHAZADO', 'CANCELADO']).optional()
});


export const createManualSale = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user?.id;
        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const data = createManualSaleSchema.parse(req.body);

        const sale = await service.createManualSale({
            customerEmail: data.customerEmail,
            items: data.items,
            medioPago: data.medioPago,
            estado: data.estado || 'APROBADO'
        });

        res.status(201).json({ success: true, data: sale });
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Datos de venta inválidos', details: e.errors });
        }
        if (e.message.includes('no encontrado') || e.message.includes('Stock insuficiente')) {
            return res.status(400).json({ success: false, error: e.message });
        }
        res.status(500).json({ success: false, error: e.message });
    }
};

export const uploadReceipt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let receiptUrl = undefined;
        const reqAny = req as any;
        if (reqAny.file) {
            receiptUrl = reqAny.file.path;
        }

        const updated = await service.uploadReceipt(Number(id), receiptUrl);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { medioPago } = req.body;

        if (!['TRANSFERENCIA', 'BINANCE', 'EFECTIVO', 'MERCADOPAGO', 'VIUMI'].includes(medioPago)) {
            return res.status(400).json({ success: false, error: 'Medio de pago inválido' });
        }

        const updated = await service.updatePaymentMethod(Number(id), medioPago);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await service.cancelOrder(Number(id));
        res.json({ success: true, data: result });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getMySales = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const sales = await service.findByUserId(userId);
        res.json({ success: true, data: sales });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const handleMPCallback = async (req: Request, res: Response) => {
    try {
        const { status, external_reference } = req.query;
        const saleId = Number(external_reference);



        if (saleId && status === 'approved') {
            await prisma.venta.update({
                where: { id: saleId },
                data: {
                    estado: VentaEstado.APROBADO,
                    medioPago: 'MERCADOPAGO'
                }
            });

        }


        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
        res.redirect(`${frontendUrl}/cuenta/miscompras?status=${status}`);

    } catch (error) {
        console.error('[MP Callback] Error:', error);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
        res.redirect(`${frontendUrl}/cuenta/miscompras?status=error`);
    }
};

export const handleMPWebhook = async (req: Request, res: Response) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;





























            await service.processMPWebhook(paymentId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[MP Webhook] Error:', error);
        res.status(500).send('Error');
    }
};

export const getSaleById = async (req: Request, res: Response) => {
    try {
        const sale = await service.findById(Number(req.params.id));
        if (!sale) return res.status(404).json({ success: false, error: 'Not Found' });
        res.json({ success: true, data: sale });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getAllSales = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const month = req.query.month ? Number(req.query.month) : undefined;
        const year = req.query.year ? Number(req.query.year) : undefined;
        const paymentMethod = req.query.paymentMethod ? String(req.query.paymentMethod) : undefined;
        const date = req.query.date ? String(req.query.date) : undefined;

        const result = await service.findAll(page, 20, undefined, month, year, paymentMethod, date);
        res.json({ success: true, ...result });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(VentaEstado).includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });

        const updated = await service.updateStatus(Number(id), status);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const dispatchSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { trackingCode } = req.body;
        if (!trackingCode) return res.status(400).json({ success: false, error: 'Tracking required' });

        const updated = await service.updateStatus(Number(id), VentaEstado.ENVIADO);

        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getBalance = async (req: Request, res: Response) => {
    try {
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const data = await service.getMonthlyBalance(year);
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};


export const createZipnovaShipment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const saleId = Number(id);

        const result = await service.createShipmentForSale(saleId);

        res.json({
            success: true,
            data: result,
            message: 'Envío creado exitosamente en Zipnova'
        });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getShipmentLabel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const saleId = Number(id);

        const labelUrl = await service.getShipmentLabel(saleId);

        if (!labelUrl) {
            return res.status(404).json({
                success: false,
                error: 'Esta venta no tiene etiqueta de envío generada'
            });
        }

        res.json({ success: true, data: { labelUrl } });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};
