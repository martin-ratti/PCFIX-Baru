import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';
import { CryptoService } from '../../shared/services/CryptoService';

const cryptoService = new CryptoService();

// Obtener configuración actual
export const getConfig = async (req: Request, res: Response) => {
    try {
        // Asumimos que solo hay una configuración con ID 1
        const config = await prisma.configuracion.findFirst({
            where: { id: 1 }
        });

        if (!config) {
            const newConfig = await prisma.configuracion.create({
                data: {
                    nombreBanco: "Banco Galicia",
                    titular: "PCFIX S.R.L.",
                    cbu: "0000000000000000000000",
                    alias: "PCFIX.PAGOS"
                }
            });
            return res.json({ success: true, data: newConfig });
        }

        res.json({ success: true, data: config });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
};

// Actualizar configuración manual
export const updateConfig = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const updated = await prisma.configuracion.update({
            where: { id: 1 },
            data: {
                // Banco
                nombreBanco: data.nombreBanco,
                titular: data.titular,
                cbu: data.cbu,
                alias: data.alias,
                // Envío
                costoEnvioFijo: data.costoEnvioFijo, // Si lo envías
                // Crypto
                binanceAlias: data.binanceAlias,
                binanceCbu: data.binanceCbu,
                cotizacionUsdt: data.cotizacionUsdt ? Number(data.cotizacionUsdt) : undefined,
                // Local
                direccionLocal: data.direccionLocal,
                horariosLocal: data.horariosLocal,
                maintenanceMode: data.maintenanceMode
            }
        });

        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// Sincronizar Cotización
export const syncUsdt = async (req: Request, res: Response) => {
    try {
        const price = await cryptoService.getUsdtPrice();

        const updated = await prisma.configuracion.update({
            where: { id: 1 },
            data: { cotizacionUsdt: price }
        });

        res.json({
            success: true,
            data: updated,
            message: `Cotización actualizada a $${price} ARS`
        });
    } catch (e: any) {
        console.error("Error sync:", e);
        res.status(500).json({ success: false, error: e.message || "Error conectando con Binance" });
    }
};

// Enviar Email de Contacto
import { EmailService } from '../../shared/services/EmailService';

export const sendContactEmail = async (req: Request, res: Response) => {
    try {
        const { nombre, apellido, email, telefono, mensaje } = req.body;

        if (!nombre || !email || !mensaje) {
            return res.status(400).json({ success: false, error: "Faltan datos obligatorios" });
        }

        const emailService = new EmailService();
        const userName = `${nombre} ${apellido || ''}`.trim();

        // 1. Notificar al Admin (Non-blocking)
        emailService.sendNewInquiryNotification(email, userName, "Consulta Web", mensaje)
            .catch(e => console.error("Fallo notifiación admin:", e));

        // 2. Confirmar al Usuario (Non-blocking)
        emailService.sendContactConfirmationEmail(email, userName)
            .catch(e => console.error("Fallo confirmación contacto:", e));

        res.json({ success: true, message: "Consulta enviada correctamente" });
    } catch (e: any) {
        console.error("Error enviando contacto:", e);
        res.status(500).json({ success: false, error: "Error al enviar el mensaje" });
    }
};