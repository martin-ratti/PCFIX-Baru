import { prisma } from '../../shared/database/prismaClient';
import { VentaEstado } from '@prisma/client';
import { EmailService } from '../../shared/services/EmailService';
import { ShippingService, ShippingItem } from '../../shared/services/ShippingService';

export class SalesService {
  private emailService: EmailService;
  private shippingService: ShippingService;

  constructor() {
    this.emailService = new EmailService();
    this.shippingService = new ShippingService();
  }

  // --- NUEVO MÉTODO: COTIZAR (Para el Carrito) ---
  async getQuote(zipCode: string, items: { id: number; quantity: number }[]) {
    // 1. Obtener datos reales de los productos (Peso y Dimensiones)
    const productIds = items.map((i) => Number(i.id));
    const dbProducts = await prisma.producto.findMany({
      where: { id: { in: productIds } },
      select: { 
        id: true, peso: true, 
        alto: true, ancho: true, profundidad: true 
      }
    });

    // 2. Mapear a formato logístico
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

    // 3. Consultar a Zippin
    return await this.shippingService.calculateCost(zipCode, shippingItems);
  }

  // 1. CREAR VENTA (Checkout Web)
  async createSale(
      userId: number, 
      items: any[], 
      _frontendSubtotal: number, 
      cpDestino?: string,
      tipoEntrega: string = 'ENVIO', 
      medioPago: string = 'TRANSFERENCIA'
  ) {
    let cliente = await prisma.cliente.findUnique({ where: { userId } });
    if (!cliente) {
      cliente = await prisma.cliente.create({ data: { userId } });
    }

    const productIds = items.map((i: any) => Number(i.id));
    const dbProducts = await prisma.producto.findMany({
        where: { id: { in: productIds } },
        select: { 
            id: true, peso: true, precio: true, stock: true, nombre: true,
            alto: true, ancho: true, profundidad: true 
        }
    });

    let subtotalReal = 0;
    const lineasParaCrear: { productoId: number; cantidad: number; subTotal: number }[] = [];
    const itemsParaEnvio: ShippingItem[] = [];

    for (const item of items) {
        const dbProduct = dbProducts.find(p => p.id === Number(item.id));
        if (!dbProduct) throw new Error(`Producto ${item.id} no encontrado`);
        if (dbProduct.stock < item.quantity) throw new Error(`Stock insuficiente: ${dbProduct.nombre}`);

        const precio = Number(dbProduct.precio);
        const subTotal = precio * item.quantity;
        subtotalReal += subTotal;
        
        lineasParaCrear.push({
            productoId: dbProduct.id,
            cantidad: item.quantity,
            subTotal: subTotal
        });

        itemsParaEnvio.push({
            weight: Number(dbProduct.peso) || 0.1,
            height: dbProduct.alto || 10,
            width: dbProduct.ancho || 10,
            depth: dbProduct.profundidad || 10,
            quantity: item.quantity
        });
    }

    // Calcular envío usando Zippin
    let costoEnvio = 0;
    if (tipoEntrega === 'ENVIO') {
        if (cpDestino) {
            costoEnvio = await this.shippingService.calculateCost(cpDestino, itemsParaEnvio);
        } else {
            const config = await prisma.configuracion.findFirst();
            costoEnvio = config ? Number(config.costoEnvioFijo) : 6500;
        }
    }

    const finalTotal = subtotalReal + costoEnvio;

    return await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          cliente: { connect: { id: cliente!.id } },
          montoTotal: finalTotal,
          costoEnvio: costoEnvio,
          tipoEntrega: tipoEntrega,
          medioPago: medioPago,
          metodoEnvio: tipoEntrega === 'RETIRO' ? "RETIRO_LOCAL" : "ZIPPIN_LOGISTICA",
          estado: VentaEstado.PENDIENTE_PAGO,
          lineasVenta: { create: lineasParaCrear }
        },
        include: { lineasVenta: true }
      });

      for (const linea of lineasParaCrear) {
        await tx.producto.update({
          where: { id: linea.productoId },
          data: { stock: { decrement: linea.cantidad } }
        });
      }
      return venta;
    });
  }

  // 2. VENTA MANUAL (POS Admin)
  async createManualSale(
      adminUserId: number, 
      targetUserEmail: string, 
      items: any[], 
      medioPago: string,
      estadoInicial: VentaEstado = VentaEstado.ENTREGADO 
  ) {
    let user = await prisma.user.findUnique({ where: { email: targetUserEmail } });
    if (!user) throw new Error("Cliente no encontrado.");

    let cliente = await prisma.cliente.findUnique({ where: { userId: user.id } });
    if (!cliente) cliente = await prisma.cliente.create({ data: { userId: user.id } });

    const productIds = items.map((i: any) => Number(i.id));
    const dbProducts = await prisma.producto.findMany({
        where: { id: { in: productIds } },
        select: { id: true, precio: true, stock: true, nombre: true }
    });

    let subtotalReal = 0;
    const lineasParaCrear: { productoId: number; cantidad: number; subTotal: number }[] = [];

    for (const item of items) {
        const dbProduct = dbProducts.find(p => p.id === Number(item.id));
        if (!dbProduct) throw new Error(`Producto ${item.id} no encontrado`);
        
        if (dbProduct.stock < item.quantity && dbProduct.stock < 90000) {
             throw new Error(`Stock insuficiente: ${dbProduct.nombre}`);
        }

        const precio = Number(dbProduct.precio);
        const subTotal = precio * item.quantity;
        subtotalReal += subTotal;

        lineasParaCrear.push({
            productoId: dbProduct.id,
            cantidad: item.quantity,
            subTotal: subTotal
        });
    }

    return await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          cliente: { connect: { id: cliente!.id } },
          montoTotal: subtotalReal,
          costoEnvio: 0, 
          tipoEntrega: "RETIRO",
          medioPago: medioPago,
          metodoEnvio: "POS_MANUAL", 
          estado: estadoInicial,
          lineasVenta: { create: lineasParaCrear }
        }
      });

      for (const linea of lineasParaCrear) {
        const prod = dbProducts.find(p => p.id === linea.productoId);
        if (prod && prod.stock < 90000) {
            await tx.producto.update({
              where: { id: linea.productoId },
              data: { stock: { decrement: linea.cantidad } }
            });
        }
      }
      return venta;
    });
  }

  // 3. SUBIR COMPROBANTE
  async uploadReceipt(saleId: number, receiptUrl?: string) {
    const dataToUpdate: any = { estado: VentaEstado.PENDIENTE_APROBACION };
    if (receiptUrl) dataToUpdate.comprobante = receiptUrl;

    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: dataToUpdate,
      include: { cliente: { include: { user: true } } }
    });

    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendNewReceiptNotification(saleId, updatedSale.cliente.user.email)
            .catch(console.error);
    }
    return updatedSale;
  }

  // 4. CAMBIAR MÉTODO PAGO
  async updatePaymentMethod(saleId: number, medioPago: string) {
    const sale = await prisma.venta.findUnique({ where: { id: saleId } });
    if (!sale) throw new Error("Venta no encontrada");
    if (sale.estado !== VentaEstado.PENDIENTE_PAGO) throw new Error("Venta en proceso");

    return await prisma.venta.update({ where: { id: saleId }, data: { medioPago } });
  }

  // 5. CANCELAR ORDEN
  async cancelOrder(saleId: number) {
    const sale = await prisma.venta.findUnique({ 
        where: { id: saleId },
        include: { lineasVenta: true }
    });
    if (!sale || sale.estado !== VentaEstado.PENDIENTE_PAGO) throw new Error("No se puede cancelar");

    await prisma.$transaction(async (tx) => {
        for (const linea of sale.lineasVenta) {
            await tx.producto.update({
                where: { id: linea.productoId },
                data: { stock: { increment: linea.cantidad } }
            });
        }
        await tx.venta.update({ where: { id: saleId }, data: { estado: VentaEstado.CANCELADO } });
    });
    return { success: true, message: "Orden cancelada" };
  }

  // 6. ACTUALIZAR ESTADO
  async updateStatus(saleId: number, status: VentaEstado) {
    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: { estado: status },
      include: { cliente: { include: { user: true } } }
    });
    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendStatusUpdate(updatedSale.cliente.user.email, saleId, status).catch(console.error);
    }
    return updatedSale;
  }

  // 7. DESPACHAR
  async dispatchSale(saleId: number, trackingCode: string) {
    const sale = await prisma.venta.findUnique({ where: { id: saleId } });
    if (!sale || sale.estado !== VentaEstado.APROBADO) throw new Error("Debe estar APROBADO");

    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: { estado: VentaEstado.ENVIADO, codigoSeguimiento: trackingCode },
      include: { cliente: { include: { user: true } } }
    });
    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendDispatchNotification(updatedSale.cliente.user.email, saleId, trackingCode).catch(console.error);
    }
    return updatedSale;
  }
  
  // 8. LISTAR TODO
  async findAll(page: number = 1, limit: number = 10, month?: number, year?: number, paymentMethod?: string) {
      const skip = (page - 1) * limit;
      let whereClause: any = {};
      if (month && year) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59, 999);
          whereClause.fecha = { gte: startDate, lte: endDate };
      } else if (year) {
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
          whereClause.fecha = { gte: startDate, lte: endDate };
      }
      if (paymentMethod) whereClause.medioPago = paymentMethod;

      const [total, sales] = await prisma.$transaction([
        prisma.venta.count({ where: whereClause }),
        prisma.venta.findMany({
          where: whereClause,
          include: { 
            cliente: { include: { user: true } },
            lineasVenta: { include: { producto: true } } 
          },
          orderBy: { fecha: 'desc' },
          take: limit,
          skip
        })
      ]);
      return { data: sales, meta: { total, page, lastPage: Math.ceil(total/limit), limit } };
  }

  // 9. BUSCAR POR ID
  async findById(id: number) {
      return await prisma.venta.findUnique({
          where: { id },
          include: { lineasVenta: { include: { producto: true } }, cliente: { include: { user: true } } }
      });
  }

  // 10. MIS COMPRAS
  async findByUserId(userId: number, limit: number = 20) {
    return await prisma.venta.findMany({
      where: { cliente: { userId } },
      include: { lineasVenta: { include: { producto: true } } },
      orderBy: { fecha: 'desc' },
      take: limit
    });
  }

  // 11. BALANCE MENSUAL
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
                const categoria = line.producto.categoria.nombre.toLowerCase();
                if (categoria.includes('servicio')) saleServices += Number(line.subTotal);
                else saleProducts += Number(line.subTotal);
            });
            saleProducts += Number(v.costoEnvio || 0);
            entry.services += saleServices;
            entry.products += saleProducts;
            entry.total += (saleServices + saleProducts);
        }
    });
    return Array.from(balanceMap.values());
  }
}