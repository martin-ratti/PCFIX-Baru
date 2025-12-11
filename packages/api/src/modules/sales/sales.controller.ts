import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';
import { z } from 'zod';
import { SalesService } from './sales.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';
import { VentaEstado } from '@prisma/client';

const service = new SalesService();

// --- COTIZACIÓN ---
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
    // Dirección de envío para Zipnova
    direccionEnvio: z.string().optional(),
    ciudadEnvio: z.string().optional(),
    provinciaEnvio: z.string().optional(),
    telefonoEnvio: z.string().optional(),
    documentoEnvio: z.string().optional() // DNI del destinatario
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

        const items = sale.lineasVenta.map((line: any) => {
            const unitPrice = Number(line.subTotal) / Number(line.cantidad);
            return {
                id: String(line.productoId),
                title: line.producto.nombre || 'Producto',
                quantity: Number(line.cantidad),
                unit_price: Number(unitPrice.toFixed(2)), // Ensure 2 decimal places max
                currency_id: 'ARS'
            };
        });



        // Use user email if available, otherwise a placeholder (MP requires email)
        const payerEmail = sale.cliente?.user?.email || 'test_user_123456@testuser.com';

        const link = await mpService.createPreference(Number(id), items, payerEmail);
        res.json({ success: true, data: { url: link } });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

const createManualSaleSchema = z.object({
    customerEmail: z.string().email(),
    items: z.array(z.object({
        id: z.number(),
        quantity: z.number().min(1)
    })).min(1),
    medioPago: z.enum(['MERCADOPAGO', 'EFECTIVO', 'VIUMI', 'TRANSFERENCIA', 'BINANCE']),
    estado: z.enum(['PENDIENTE_PAGO', 'PENDIENTE_APROBACION', 'APROBADO', 'ENVIADO', 'ENTREGADO', 'RECHAZADO', 'CANCELADO']).optional()
});

// Argumentos unificados
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
        res.status(500).json({ success: false, error: e.message });
    }
};

export const uploadReceipt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let receiptUrl = undefined;
        if (req.file) {
            receiptUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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
                    estado: VentaEstado.APROBADO, // Correct enum value from 'PAGADO'
                    medioPago: 'MERCADOPAGO'
                }
            });

        }

        // Redirect to Frontend Success Page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
        res.redirect(`${frontendUrl}/cuenta/miscompras?status=${status}`);

    } catch (error) {
        console.error('[MP Callback] Error:', error);
        // Redirect to Frontend Failure Page or generic error
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
        res.redirect(`${frontendUrl}/cuenta/miscompras?status=error`);
    }
};

export const handleMPWebhook = async (req: Request, res: Response) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            console.log(`[MP Webhook] Received payment notification. Data:`, JSON.stringify(data));
            const paymentId = data.id;
            // Fetch payment details to verify status
            // We need to access the client from the service, or instantiate a new one here temporarily,
            // or better yet, delegate this to the service. For now, let's keep it simple and safe.
            // Ideally SalesService should handle this logic.
            // Checking via service would be cleaner but let's do it here:

            // NOTE: Ideally we should use mpService.client to fetch payment
            // but we don't have direct access here. 
            // Let's assume the notification is valid for now or quick-implementation:

            // BETTER APPROACH: Let's assume we trust the notification OR (ToDo) fetch it.
            // But 'data.id' is the Payment ID. The sale ID is in external_reference.

            // To do this properly we need to fetch the payment from MP to get external_reference
            // because the webhook body might not have it directly in 'data'.

            // However, to avoid circular deps or complex refactor, let's try to infer or just respond 200 OK
            // and actually implement the fetch.

            /* 
               Since we need to fetch the payment to know the order ID (external_reference),
               we really should use the MP Client. 
            */

            // QUICK FIX: We will just log it for now and respond 200 so MP doesn't retry infinitely 
            // until we add the proper fetch logic. 
            // BUT the user needs this working. 

            // Re-instantiating MP Service locally to use its client? 
            // It's private. Let's make a clear separation.

            // Delegate to Service:
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
        // Validamos si status es válido
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

// ========== ZIPNOVA INTEGRATION ==========
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