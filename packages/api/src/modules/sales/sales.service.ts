import { prisma } from '../../shared/database/prismaClient';
import { VentaEstado } from '@prisma/client';
import { EmailService } from '../../shared/services/EmailService';
import { ShippingService, ShippingItem } from '../../shared/services/ShippingService';

interface SaleItemInput { id: number; quantity: number; }

interface SaleItemInput { id: number; quantity: number; }

interface SaleLineItem {
    productoId: number;
    cantidad: number;
    subTotal: number;
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
            const product = dbProducts.find((p) => p.id === Number(item.id));
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

    // 2. CREAR VENTA WEB
    async createSale(userId: number, items: any[], _frontendSubtotal: number, cpDestino?: string, tipoEntrega: string = 'ENVIO', medioPago: string = 'TRANSFERENCIA') {
        let cliente = await prisma.cliente.findUnique({ where: { userId } });
        if (!cliente) cliente = await prisma.cliente.create({ data: { userId } });

        const productIds = items.map((i: any) => Number(i.id));
        const dbProducts = await prisma.producto.findMany({ where: { id: { in: productIds } } });

        let subtotalReal = 0;
        const lineasParaCrear: SaleLineItem[] = [];
        const itemsParaEnvio: ShippingItem[] = [];

        for (const item of items) {
            const dbProduct = dbProducts.find(p => p.id === Number(item.id));
            if (!dbProduct) throw new Error(`Producto ${item.id} no encontrado`);

            if (dbProduct.stock < 90000 && dbProduct.stock < item.quantity) {
                throw new Error(`Stock insuficiente: ${dbProduct.nombre}`);
            }

            const precio = Number(dbProduct.precio);
            subtotalReal += precio * item.quantity;

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
            if (cpDestino) {
                costoEnvio = await this.shippingService.calculateCost(cpDestino, itemsParaEnvio);
            } else {
                const config = await prisma.configuracion.findFirst();
                costoEnvio = config ? Number(config.costoEnvioFijo) : 6500;
            }
        }

        return await prisma.$transaction(async (tx) => {
            const venta = await tx.venta.create({
                data: {
                    cliente: { connect: { id: cliente!.id } },
                    montoTotal: subtotalReal + costoEnvio,
                    costoEnvio, tipoEntrega, medioPago,
                    metodoEnvio: tipoEntrega === 'RETIRO' ? "RETIRO_LOCAL" : "ZIPPIN_LOGISTICA",
                    estado: VentaEstado.PENDIENTE_PAGO,
                    lineasVenta: { create: lineasParaCrear }
                },
                include: { lineasVenta: true }
            });

            for (const linea of lineasParaCrear) {
                const prod = dbProducts.find(p => p.id === linea.productoId);
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
            const product = dbProducts.find(p => p.id === item.id);
            if (!product) throw new Error(`Producto ${item.id} no encontrado`);

            if (product.stock < 90000 && product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.nombre}. Hay ${product.stock}.`);
            }

            const price = Number(product.precio);
            total += price * item.quantity;

            total += price * item.quantity;

            saleLines.push({
                productoId: product.id,
                cantidad: item.quantity,
                subTotal: price * item.quantity
            });
        }

        return await prisma.$transaction(async (tx) => {
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
                const product = dbProducts.find(p => p.id === line.productoId);
                if (product && product.stock < 90000) {
                    await tx.producto.update({ where: { id: line.productoId }, data: { stock: { decrement: line.cantidad } } });
                }
            }
            return sale;
        });
    }


    async findAll(page: number, limit: number, userId?: number, month?: number, year?: number, paymentMethod?: string) {
        const where: any = {};
        if (userId) where.cliente = { userId };

        if (month && year) {
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

        ventas.forEach(v => {
            const monthName = new Date(v.fecha).toLocaleString('es-ES', { month: 'short' });
            const entry = balanceMap.get(monthName);
            if (entry) {
                let saleServices = 0;
                let saleProducts = 0;
                v.lineasVenta.forEach(line => {
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
        return await prisma.venta.update({ where: { id: saleId }, data: { medioPago } });
    }

    async cancelOrder(saleId: number) {
        const sale = await prisma.venta.findUnique({ where: { id: saleId }, include: { lineasVenta: true } });
        if (!sale) throw new Error("Venta no encontrada");
        await prisma.$transaction(async (tx) => {
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
        if (updated.cliente?.user?.email) this.emailService.sendStatusUpdate(updated.cliente.user.email, saleId, status).catch(console.error);
        return updated;
    }
}