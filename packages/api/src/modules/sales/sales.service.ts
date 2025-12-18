import { prisma } from '../../shared/database/prismaClient';
import { VentaEstado } from '@prisma/client';
import { EmailService } from '../../shared/services/EmailService';
import { ShippingService, ShippingItem } from '../../shared/services/ShippingService';
import { MercadoPagoService } from '../../shared/services/MercadoPagoService';

interface SaleItemInput {
    id: number;
    quantity: number;
    customPrice?: number;
    customDescription?: string;
}

interface SaleLineItem {
    productoId: number;
    cantidad: number;
    subTotal: number;
    customPrice?: number | null;
    customDescription?: string | null;
}

export class SalesService {
    private emailService: EmailService;
    private shippingService: ShippingService;

    constructor() {
        this.emailService = new EmailService();
        this.shippingService = new ShippingService();
    }

    // 1. COTIZAR ENVÍO
    async getQuote(zipCode: string, items: { id: number; quantity: number }[]) {
        const productIds = items.map((i) => Number(i.id));
        const dbProducts = await prisma.producto.findMany({
            where: { id: { in: productIds } },
            select: { id: true, peso: true, alto: true, ancho: true, profundidad: true }
        });

        const shippingItems: ShippingItem[] = items.map((item) => {
            const product = dbProducts.find((p: any) => p.id === Number(item.id));
            return {
                weight: Number(product?.peso) || 0.5,
                height: product?.alto || 10,
                width: product?.ancho || 10,
                depth: product?.profundidad || 10,
                quantity: item.quantity
            };
        });

        return await this.shippingService.calculateCost(zipCode, shippingItems);
    }

    // --- VIUMI ---
    async createViumiPreference(saleId: number) {
        const sale = await prisma.venta.findUnique({
            where: { id: saleId },
            include: { cliente: { include: { user: true } }, lineasVenta: { include: { producto: true } } }
        });
        if (!sale) throw new Error("Venta no encontrada");

        // Define callback URL (where user returns after paying)
        const callbackUrl = `${process.env.APP_URL || 'http://localhost:4321'}/checkout/viumi-success`;

        // Transform items
        const items = sale.lineasVenta.map((line: any) => ({
            nombre: line.producto.nombre,
            cantidad: line.cantidad,
            precio: Number(line.subTotal) / line.cantidad
        }));

        // Add shipping if any (as an item)
        if (Number(sale.costoEnvio) > 0) {
            items.push({
                nombre: "Envío",
                cantidad: 1,
                precio: Number(sale.costoEnvio)
            });
        }

        // Initialize service
        const viumiService = new (require('../../shared/services/ViumiService').ViumiService)();
        return await viumiService.createPaymentPreference(sale, items, callbackUrl);
    }

    // 2. CREAR VENTA WEB
    async createSale(
        userId: number,
        items: any[],
        _frontendSubtotal: number,
        cpDestino?: string,
        tipoEntrega: string = 'ENVIO',
        medioPago: string = 'TRANSFERENCIA',
        direccionEnvio?: { direccion?: string; ciudad?: string; provincia?: string; telefono?: string; documento?: string }
    ) {
        let cliente = await prisma.cliente.findUnique({ where: { userId } });
        if (!cliente) cliente = await prisma.cliente.create({ data: { userId } });

        const productIds = items.map((i: any) => Number(i.id));
        const dbProducts = await prisma.producto.findMany({ where: { id: { in: productIds } } });

        let subtotalReal = 0;
        const lineasParaCrear: SaleLineItem[] = [];
        const itemsParaEnvio: ShippingItem[] = [];

        for (const item of items) {
            const dbProduct = dbProducts.find((p: any) => p.id === Number(item.id));
            if (!dbProduct) throw new Error(`Producto ${item.id} no encontrado`);

            if (dbProduct.stock < 90000 && dbProduct.stock < item.quantity) {
                throw new Error(`Stock insuficiente: ${dbProduct.nombre}`);
            }

            // Apply 8% discount if not paying with Mercado Pago
            let precio = Number(dbProduct.precio);
            if (medioPago !== 'MERCADOPAGO') {
                precio = precio * 0.92;
            }

            subtotalReal += precio * item.quantity;

            lineasParaCrear.push({
                productoId: dbProduct.id,
                cantidad: item.quantity,
                subTotal: precio * item.quantity
            });

            itemsParaEnvio.push({
                weight: Number(dbProduct.peso) || 0.1,
                height: dbProduct.alto || 10,
                width: dbProduct.ancho || 10,
                depth: dbProduct.profundidad || 10,
                quantity: item.quantity
            });
        }

        let costoEnvio = 0;
        if (tipoEntrega === 'ENVIO') {
            let baseCosto = 0;
            if (cpDestino) {
                baseCosto = await this.shippingService.calculateCost(cpDestino, itemsParaEnvio);
            } else {
                const config = await prisma.configuracion.findFirst();
                baseCosto = config ? Number(config.costoEnvioFijo) : 6500;
            }
            // Apply 21% VAT to shipping
            costoEnvio = baseCosto * 1.21;
        }

        return await prisma.$transaction(async (tx: any) => {
            const venta = await tx.venta.create({
                data: {
                    cliente: { connect: { id: cliente!.id } },
                    montoTotal: subtotalReal + costoEnvio,
                    costoEnvio, tipoEntrega, medioPago,
                    metodoEnvio: tipoEntrega === 'RETIRO' ? "RETIRO_LOCAL" : "ZIPPIN_LOGISTICA",
                    estado: VentaEstado.PENDIENTE_PAGO,
                    lineasVenta: { create: lineasParaCrear },
                    // Guardar dirección de envío para Zipnova
                    direccionEnvio: direccionEnvio?.direccion || null,
                    ciudadEnvio: direccionEnvio?.ciudad || null,
                    provinciaEnvio: direccionEnvio?.provincia || null,
                    cpEnvio: cpDestino || null,
                    telefonoEnvio: direccionEnvio?.telefono || null,
                    documentoEnvio: direccionEnvio?.documento || null
                },
                include: { lineasVenta: true }
            });

            for (const linea of lineasParaCrear) {
                const prod = dbProducts.find((p: any) => p.id === linea.productoId);
                if (prod && prod.stock < 90000) {
                    await tx.producto.update({ where: { id: linea.productoId }, data: { stock: { decrement: linea.cantidad } } });
                }
            }
            return venta;
        });
    }

    // 3. CREAR VENTA MANUAL (POS)
    async createManualSale(data: { customerEmail: string, items: SaleItemInput[], medioPago: string, estado: string }) {

        let user = await prisma.user.findUnique({ where: { email: data.customerEmail } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: data.customerEmail,
                    nombre: 'Cliente',
                    apellido: 'Mostrador',
                    password: '',
                    role: 'USER'
                }
            });
        }

        let client = await prisma.cliente.findUnique({ where: { userId: user.id } });
        if (!client) client = await prisma.cliente.create({ data: { userId: user.id, direccion: 'Local', telefono: '' } });

        const productIds = data.items.map(i => i.id);
        const dbProducts = await prisma.producto.findMany({ where: { id: { in: productIds } } });

        let total = 0;
        const saleLines: SaleLineItem[] = [];

        for (const item of data.items) {
            const product = dbProducts.find((p: any) => p.id === item.id);
            if (!product) throw new Error(`Producto ${item.id} no encontrado`);

            if (product.stock < 90000 && product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.nombre}. Hay ${product.stock}.`);
            }

            // Custom Service Logic: Use custom price if provided, otherwise list price
            let price = Number(product.precio);
            if (item.customPrice !== undefined && item.customPrice !== null) {
                price = Number(item.customPrice);
            }

            total += price * item.quantity;

            saleLines.push({
                productoId: product.id,
                cantidad: item.quantity,
                subTotal: price * item.quantity,
                customPrice: item.customPrice ? Number(item.customPrice) : null,
                customDescription: item.customDescription || null
            });
        }

        return await prisma.$transaction(async (tx: any) => {
            const sale = await tx.venta.create({
                data: {
                    clienteId: client!.id,
                    fecha: new Date(),
                    estado: data.estado as any,
                    medioPago: data.medioPago,
                    montoTotal: total,
                    tipoEntrega: 'RETIRO',
                    lineasVenta: { create: saleLines }
                }
            });

            for (const line of saleLines) {
                const product = dbProducts.find((p: any) => p.id === line.productoId);
                if (product && product.stock < 90000) {
                    await tx.producto.update({ where: { id: line.productoId }, data: { stock: { decrement: line.cantidad } } });
                }
            }
            return sale;
        });
    }


    async findAll(page: number, limit: number, userId?: number, month?: number, year?: number, paymentMethod?: string, date?: string) {
        const where: any = {};
        if (userId) where.cliente = { userId };

        if (date) {
            // Filter by specific date (YYYY-MM-DD)
            const [y, m, d] = date.split('-').map(Number);
            const startDate = new Date(y, m - 1, d, 0, 0, 0);
            const endDate = new Date(y, m - 1, d, 23, 59, 59);
            where.fecha = { gte: startDate, lte: endDate };
        } else if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            where.fecha = { gte: startDate, lte: endDate };
        } else if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59);
            where.fecha = { gte: startDate, lte: endDate };
        }
        if (paymentMethod) where.medioPago = paymentMethod;

        const [total, sales] = await prisma.$transaction([
            prisma.venta.count({ where }),
            prisma.venta.findMany({
                where,
                include: { cliente: { include: { user: true } }, lineasVenta: { include: { producto: true } } },
                orderBy: { fecha: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            })
        ]);
        return { data: sales, meta: { total, page, lastPage: Math.ceil(total / limit), limit } };
    }

    async findById(id: number) {
        return await prisma.venta.findUnique({
            where: { id },
            include: { lineasVenta: { include: { producto: true } }, cliente: { include: { user: true } } }
        });
    }

    async findByUserId(userId: number, limit: number = 20) {
        return await prisma.venta.findMany({
            where: { cliente: { userId } },
            include: { lineasVenta: { include: { producto: true } } },
            orderBy: { fecha: 'desc' },
            take: limit
        });
    }

    async getMonthlyBalance(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        const ventas = await prisma.venta.findMany({
            where: {
                fecha: { gte: startDate, lte: endDate },
                estado: { in: ['APROBADO', 'ENVIADO', 'ENTREGADO'] }
            },
            include: {
                lineasVenta: { include: { producto: { include: { categoria: true } } } }
            },
            orderBy: { fecha: 'asc' }
        });

        const balanceMap = new Map<string, any>();
        for (let i = 0; i < 12; i++) {
            const d = new Date(year, i, 1);
            const monthName = d.toLocaleString('es-ES', { month: 'short' });
            balanceMap.set(monthName, { name: monthName, products: 0, services: 0, total: 0, monthIndex: i + 1 });
        }

        ventas.forEach((v: any) => {
            const monthName = new Date(v.fecha).toLocaleString('es-ES', { month: 'short' });
            const entry = balanceMap.get(monthName);
            if (entry) {
                let saleServices = 0;
                let saleProducts = 0;
                v.lineasVenta.forEach((line: any) => {
                    const categoria = line.producto.categoria?.nombre.toLowerCase() || '';
                    if (categoria.includes('servicio') || line.producto.stock > 90000) {
                        saleServices += Number(line.subTotal);
                    } else {
                        saleProducts += Number(line.subTotal);
                    }
                });
                saleProducts += Number(v.costoEnvio || 0);
                entry.services += saleServices;
                entry.products += saleProducts;
                entry.total += (saleServices + saleProducts);
            }
        });
        return Array.from(balanceMap.values());
    }

    async uploadReceipt(saleId: number, receiptUrl?: string) {
        const dataToUpdate: any = { estado: VentaEstado.PENDIENTE_APROBACION };
        if (receiptUrl) dataToUpdate.comprobante = receiptUrl;
        const updated = await prisma.venta.update({ where: { id: saleId }, data: dataToUpdate, include: { cliente: { include: { user: true } } } });
        if (updated.cliente?.user?.email) this.emailService.sendNewReceiptNotification(saleId, updated.cliente.user.email).catch(console.error);
        return updated;
    }

    async updatePaymentMethod(saleId: number, medioPago: string) {
        const sale = await prisma.venta.findUnique({
            where: { id: saleId },
            include: { lineasVenta: { include: { producto: true } } }
        });

        if (!sale) throw new Error('Venta no encontrada');

        // Recalculate prices based on new payment method
        let newSubtotal = 0;
        const updateLinesPromises = sale.lineasVenta.map(line => {
            let unitPrice = Number(line.producto.precio);

            // Apply 8% discount if NOT MercadoPago
            if (medioPago !== 'MERCADOPAGO') {
                unitPrice = unitPrice * 0.92;
            }

            const newLineSubtotal = unitPrice * line.cantidad;
            newSubtotal += newLineSubtotal;

            return prisma.lineaVenta.update({
                where: { id: line.id },
                data: { subTotal: newLineSubtotal }
            });
        });

        // Update Sale Total (Subtotal + Shipping)
        const newTotal = newSubtotal + Number(sale.costoEnvio || 0);

        return await prisma.$transaction([
            ...updateLinesPromises,
            prisma.venta.update({
                where: { id: saleId },
                data: {
                    medioPago,
                    montoTotal: newTotal
                },
                include: { lineasVenta: { include: { producto: true } } }
            })
        ]).then(results => results[results.length - 1]); // Return the updated sale
    }

    async cancelOrder(saleId: number) {
        const sale = await prisma.venta.findUnique({ where: { id: saleId }, include: { lineasVenta: true } });
        if (!sale) throw new Error("Venta no encontrada");
        await prisma.$transaction(async (tx: any) => {
            for (const linea of sale.lineasVenta) {
                const prod = await tx.producto.findUnique({ where: { id: linea.productoId } });
                if (prod && prod.stock < 90000) {
                    await tx.producto.update({ where: { id: linea.productoId }, data: { stock: { increment: linea.cantidad } } });
                }
            }
            await tx.venta.update({ where: { id: saleId }, data: { estado: VentaEstado.CANCELADO } });
        });
        return { success: true };
    }

    async updateStatus(saleId: number, status: VentaEstado) {
        const updated = await prisma.venta.update({ where: { id: saleId }, data: { estado: status }, include: { cliente: { include: { user: true } } } });
        if (updated.cliente?.user?.email) {
            this.emailService.sendStatusUpdate(updated.cliente.user.email, saleId, status, updated.tipoEntrega).catch(console.error);
        }
        return updated;
    }

    async processMPWebhook(paymentId: string) {
        const mpService = new MercadoPagoService();
        const payment = await mpService.getPayment(paymentId);

        if (payment.status === 'approved' && payment.external_reference) {
            const saleId = Number(payment.external_reference);
            const sale = await prisma.venta.findUnique({ where: { id: saleId } });

            // Only update if not already approved to avoid duplicate emails/updates
            if (sale && sale.estado !== VentaEstado.APROBADO) {
                await this.updateStatus(saleId, VentaEstado.APROBADO);
                await this.updatePaymentMethod(saleId, 'MERCADOPAGO');
                console.log(`[Webhook] Sale ${saleId} approved via MP Webhook`);
            }
        }
    }

    // ========== ZIPNOVA INTEGRATION ==========

    async createShipmentForSale(saleId: number) {
        const sale = await prisma.venta.findUnique({
            where: { id: saleId },
            include: {
                lineasVenta: { include: { producto: true } },
                cliente: { include: { user: true } }
            }
        });

        if (!sale) throw new Error('Venta no encontrada');
        if (sale.tipoEntrega !== 'ENVIO') throw new Error('Esta venta es retiro en local, no requiere envío');
        if (sale.zipnovaShipmentId) throw new Error('Esta venta ya tiene un envío creado en Zipnova');
        if (!sale.direccionEnvio || !sale.ciudadEnvio || !sale.provinciaEnvio || !sale.cpEnvio) {
            throw new Error('Faltan datos de dirección de envío');
        }

        // Preparar items para Zipnova
        const items: ShippingItem[] = sale.lineasVenta.map((linea: any) => ({
            weight: Number(linea.producto.peso) || 0.5,
            height: linea.producto.alto || 10,
            width: linea.producto.ancho || 10,
            depth: linea.producto.profundidad || 10,
            quantity: linea.cantidad,
            description: linea.producto.nombre,
            sku: `P${linea.producto.id}`
        }));

        // Crear envío en Zipnova
        const result = await this.shippingService.createShipment(
            items,
            {
                direccion: sale.direccionEnvio,
                ciudad: sale.ciudadEnvio,
                provincia: sale.provinciaEnvio,
                codigoPostal: sale.cpEnvio,
                telefono: sale.telefonoEnvio || '',
                nombre: `${sale.cliente?.user?.nombre || ''} ${sale.cliente?.user?.apellido || ''}`.trim(),
                email: sale.cliente?.user?.email || '',
                documento: sale.documentoEnvio || ''
            },
            Number(sale.montoTotal),
            `PCFIX-${saleId}`
        );

        // Actualizar venta con datos de Zipnova
        await prisma.venta.update({
            where: { id: saleId },
            data: {
                zipnovaShipmentId: result.shipmentId,
                codigoSeguimiento: result.trackingCode,
                etiquetaUrl: result.labelUrl,
                metodoEnvio: result.carrier
            }
        });

        // Notificar al cliente
        if (sale.cliente?.user?.email && result.trackingCode) {
            this.emailService.sendStatusUpdate(
                sale.cliente.user.email,
                saleId,
                VentaEstado.ENVIADO,
                'ENVIO'
            ).catch(console.error);
        }

        // Notificar al admin con link a Zipnova
        this.emailService.sendNewShipmentNotification(
            saleId,
            sale.cliente?.user?.email || 'N/A',
            result.shipmentId,
            result.trackingCode
        ).catch(console.error);

        return {
            shipmentId: result.shipmentId,
            trackingCode: result.trackingCode,
            labelUrl: result.labelUrl,
            carrier: result.carrier,
            estimatedDelivery: result.estimatedDelivery
        };
    }

    async getShipmentLabel(saleId: number): Promise<string | null> {
        const sale = await prisma.venta.findUnique({ where: { id: saleId } });

        if (!sale) throw new Error('Venta no encontrada');

        // Si ya tiene URL guardada, devolverla
        if (sale.etiquetaUrl) return sale.etiquetaUrl;

        // Si tiene ID de envío en Zipnova, intentar obtener etiqueta
        if (sale.zipnovaShipmentId) {
            try {
                const labelUrl = await this.shippingService.getLabel(sale.zipnovaShipmentId);

                // Guardar para cache
                if (labelUrl) {
                    await prisma.venta.update({
                        where: { id: saleId },
                        data: { etiquetaUrl: labelUrl }
                    });
                }

                return labelUrl;
            } catch (error) {
                console.error('Error obteniendo etiqueta:', error);
                return null;
            }
        }

        return null;
    }
}