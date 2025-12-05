import { prisma } from '../../shared/database/prismaClient';
import { VentaEstado } from '@prisma/client';
import { EmailService } from '../../shared/services/EmailService';
import { ShippingService } from '../../shared/services/ShippingService';

export class SalesService {
  private emailService: EmailService;
  private shippingService: ShippingService;

  constructor() {
    this.emailService = new EmailService();
    this.shippingService = new ShippingService();
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
    // 1. Validar / Crear Cliente
    let cliente = await prisma.cliente.findUnique({ where: { userId } });
    if (!cliente) {
      cliente = await prisma.cliente.create({ data: { userId } });
    }

    // 2. Obtener productos reales de la DB
    const productIds = items.map((i: any) => Number(i.id));
    const dbProducts = await prisma.producto.findMany({
        where: { id: { in: productIds } },
        select: { id: true, peso: true, precio: true, stock: true, nombre: true }
    });

    let pesoTotal = 0;
    let subtotalReal = 0;
    
    // Tipado explícito para evitar error TS7034
    const lineasParaCrear: { productoId: number; cantidad: number; subTotal: number }[] = [];

    for (const item of items) {
        const dbProduct = dbProducts.find(p => p.id === Number(item.id));
        
        if (!dbProduct) throw new Error(`Producto ID ${item.id} no encontrado`);
        if (dbProduct.stock < item.quantity) throw new Error(`Stock insuficiente para: ${dbProduct.nombre}`);

        const precioUnitario = Number(dbProduct.precio);
        const subTotalLinea = precioUnitario * item.quantity;
        subtotalReal += subTotalLinea;
        
        const pesoUnitario = Number(dbProduct.peso) || 0.5;
        pesoTotal += pesoUnitario * item.quantity;

        lineasParaCrear.push({
            productoId: dbProduct.id,
            cantidad: item.quantity,
            subTotal: subTotalLinea
        });
    }

    // 3. Costo de Envío
    let costoEnvio = 0;
    if (tipoEntrega === 'ENVIO') {
        if (cpDestino) {
            costoEnvio = await this.shippingService.calculateCost(cpDestino, pesoTotal);
        } else {
            const config = await prisma.configuracion.findFirst();
            costoEnvio = config ? Number(config.costoEnvioFijo) : 5000;
        }
    } else {
        costoEnvio = 0; // Retiro en local es gratis
    }

    const finalTotal = subtotalReal + costoEnvio;

    // 4. Transacción
    return await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          cliente: { connect: { id: cliente!.id } },
          montoTotal: finalTotal,
          costoEnvio: costoEnvio,
          tipoEntrega: tipoEntrega,
          medioPago: medioPago,
          metodoEnvio: tipoEntrega === 'RETIRO' ? "RETIRO_LOCAL" : "CORREO_ARGENTINO",
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
    if (!user) throw new Error("Cliente no encontrado. Usa 'mostrador@pcfix.com' para anónimos.");

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
        
        // Servicios (stock > 90000) no chequean stock real
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
        await tx.producto.update({
          where: { id: linea.productoId },
          data: { stock: { decrement: linea.cantidad } }
        });
      }
      return venta;
    });
  }

  // 3. SUBIR COMPROBANTE (Opcional para efectivo)
  async uploadReceipt(saleId: number, receiptUrl?: string) {
    const dataToUpdate: any = {
        estado: VentaEstado.PENDIENTE_APROBACION 
    };

    if (receiptUrl) {
        dataToUpdate.comprobante = receiptUrl;
    }

    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: dataToUpdate,
      include: { cliente: { include: { user: true } } }
    });

    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendNewReceiptNotification(saleId, updatedSale.cliente.user.email)
            .catch((err: any) => console.error("Fallo email admin:", err));
    }
    return updatedSale;
  }

  // 4. CAMBIAR MÉTODO DE PAGO
  async updatePaymentMethod(saleId: number, medioPago: string) {
    const sale = await prisma.venta.findUnique({ where: { id: saleId } });
    if (!sale) throw new Error("Venta no encontrada");
    if (sale.estado !== VentaEstado.PENDIENTE_PAGO) throw new Error("No se puede cambiar el método de una venta en proceso");

    return await prisma.venta.update({
        where: { id: saleId },
        data: { medioPago }
    });
  }

  // 5. CANCELAR ORDEN
  async cancelOrder(saleId: number) {
    const sale = await prisma.venta.findUnique({ 
        where: { id: saleId },
        include: { lineasVenta: true }
    });

    if (!sale) throw new Error("Venta no encontrada");
    if (sale.estado !== VentaEstado.PENDIENTE_PAGO) throw new Error("Solo se pueden cancelar órdenes pendientes");

    await prisma.$transaction(async (tx) => {
        for (const linea of sale.lineasVenta) {
            await tx.producto.update({
                where: { id: linea.productoId },
                data: { stock: { increment: linea.cantidad } }
            });
        }
        await tx.venta.update({
            where: { id: saleId },
            data: { estado: VentaEstado.CANCELADO }
        });
    });

    return { success: true, message: "Orden cancelada" };
  }

  // 6. ACTUALIZAR ESTADO (Admin)
  async updateStatus(saleId: number, status: VentaEstado) {
    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: { estado: status },
      include: { cliente: { include: { user: true } } }
    });

    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendStatusUpdate(updatedSale.cliente.user.email, saleId, status)
            .catch((err: any) => console.error("Fallo email cliente:", err));
    }
    return updatedSale;
  }

  // 7. DESPACHAR (Admin)
  async dispatchSale(saleId: number, trackingCode: string) {
    const sale = await prisma.venta.findUnique({ where: { id: saleId } });
    if (!sale) throw new Error("Venta no encontrada");
    if (sale.estado !== VentaEstado.APROBADO) throw new Error("Debe estar APROBADO");

    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: { estado: VentaEstado.ENVIADO, codigoSeguimiento: trackingCode },
      include: { cliente: { include: { user: true } } }
    });

    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendDispatchNotification(updatedSale.cliente.user.email, saleId, trackingCode)
            .catch((err: any) => console.error("Fallo email tracking:", err));
    }
    return updatedSale;
  }
  
  // 8. LISTAR TODO (Admin)
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

      if (paymentMethod) {
          whereClause.medioPago = paymentMethod;
      }

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

  // 11. BALANCE MENSUAL (Desglosado)
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
                if (categoria.includes('servicio')) {
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
}