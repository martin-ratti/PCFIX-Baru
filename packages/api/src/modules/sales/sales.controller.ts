import { Request, Response } from 'express';
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
    medioPago: z.enum(['MERCADOPAGO', 'EFECTIVO', 'VIUMI', 'TRANSFERENCIA', 'BINANCE'])
});

export const createSale = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const data = createSaleSchema.parse(req.body);

        const sale = await service.createSale(userId, data.items, data.subtotal, data.cpDestino, data.tipoEntrega, data.medioPago);
        res.status(201).json({ success: true, data: sale });
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Datos de venta inválidos', details: e.errors });
        }
        res.status(500).json({ success: false, error: e.message });
    }
};

export const handleViumiWebhook = async (req: Request, res: Response) => {
    try {
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

export const createViumiPreference = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const link = await service.createViumiPreference(Number(id));
        res.json({ success: true, data: { url: link } });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// Argumentos unificados
export const createManualSale = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user?.id;
        const { customerEmail, items, medioPago, estado } = req.body;

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const sale = await service.createManualSale({
            customerEmail,
            items,
            medioPago,
            estado
        });

        res.status(201).json({ success: true, data: sale });
    } catch (e: any) {
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