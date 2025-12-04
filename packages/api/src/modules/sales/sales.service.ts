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

  // 1. CREAR VENTA
  async createSale(userId: number, items: any[], _frontendSubtotal: number, cpDestino?: string) {
    let cliente = await prisma.cliente.findUnique({ where: { userId } });
    if (!cliente) {
      cliente = await prisma.cliente.create({ data: { userId } });
    }

    const productIds = items.map((i: any) => Number(i.id));
    const dbProducts = await prisma.producto.findMany({
        where: { id: { in: productIds } },
        select: { id: true, peso: true, precio: true, stock: true, nombre: true }
    });

    let pesoTotal = 0;
    let subtotalReal = 0;
    const lineasParaCrear: { productoId: number; cantidad: number; subTotal: number }[] = [];

    for (const item of items) {
        const dbProduct = dbProducts.find(p => p.id === Number(item.id));
        if (!dbProduct) throw new Error(`Producto ID ${item.id} no encontrado`);
        if (dbProduct.stock < item.quantity) throw new Error(`Stock insuficiente para: ${dbProduct.nombre}`);

        const precioUnitario = Number(dbProduct.precio);
        subtotalReal += precioUnitario * item.quantity;
        pesoTotal += (Number(dbProduct.peso) || 0.5) * item.quantity;

        lineasParaCrear.push({
            productoId: dbProduct.id,
            cantidad: item.quantity,
            subTotal: precioUnitario * item.quantity
        });
    }

    let costoEnvio = 0;
    if (cpDestino) {
        costoEnvio = await this.shippingService.calculateCost(cpDestino, pesoTotal);
    } else {
        const config = await prisma.configuracion.findFirst();
        costoEnvio = config ? Number(config.costoEnvioFijo) : 5000;
    }

    const finalTotal = subtotalReal + costoEnvio;

    return await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          cliente: { connect: { id: cliente!.id } },
          montoTotal: finalTotal,
          costoEnvio: costoEnvio,
          metodoEnvio: "CORREO_ARGENTINO",
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

  // 2. SUBIR COMPROBANTE
  async uploadReceipt(saleId: number, receiptUrl: string) {
    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: { comprobante: receiptUrl, estado: VentaEstado.PENDIENTE_APROBACION },
      include: { cliente: { include: { user: true } } }
    });

    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendNewReceiptNotification(saleId, updatedSale.cliente.user.email)
            .catch((err: any) => console.error("Fallo email admin:", err));
    }
    return updatedSale;
  }

  // 3. ACTUALIZAR ESTADO
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

  // 4. DESPACHAR
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
  
  // 5. LISTAR TODO (Con Filtros de Fecha)
  async findAll(page: number = 1, limit: number = 10, month?: number, year?: number) {
      const skip = (page - 1) * limit;
      let dateFilter: any = {};
      
      // Filtro por Mes y Año
      if (month && year) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59, 999);
          dateFilter = { fecha: { gte: startDate, lte: endDate } };
      } 
      // Filtro solo por Año
      else if (year) {
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
          dateFilter = { fecha: { gte: startDate, lte: endDate } };
      }

      const [total, sales] = await prisma.$transaction([
        prisma.venta.count({ where: dateFilter }),
        prisma.venta.findMany({
          where: dateFilter,
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

  // 6. BUSCAR POR ID
  async findById(id: number) {
      return await prisma.venta.findUnique({
          where: { id },
          include: { lineasVenta: { include: { producto: true } }, cliente: { include: { user: true } } }
      });
  }

  // 7. MIS COMPRAS
  async findByUserId(userId: number, limit: number = 20) {
    return await prisma.venta.findMany({
      where: { cliente: { userId } },
      include: { lineasVenta: { include: { producto: true } } },
      orderBy: { fecha: 'desc' },
      take: limit
    });
  }

  // 8. BALANCE MENSUAL (Por Año)
  async getMonthlyBalance(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const ventas = await prisma.venta.findMany({
        where: {
            fecha: { gte: startDate, lte: endDate },
            estado: { in: ['APROBADO', 'ENVIADO', 'ENTREGADO'] }
        },
        select: { fecha: true, montoTotal: true },
        orderBy: { fecha: 'asc' }
    });

    const balanceMap = new Map<string, any>();
    
    // Inicializar los 12 meses
    for (let i = 0; i < 12; i++) {
        const d = new Date(year, i, 1);
        const monthName = d.toLocaleString('es-ES', { month: 'short' });
        balanceMap.set(monthName, { name: monthName, total: 0, monthIndex: i + 1 });
    }

    ventas.forEach(v => {
        const monthName = new Date(v.fecha).toLocaleString('es-ES', { month: 'short' });
        const entry = balanceMap.get(monthName);
        if (entry) entry.total += Number(v.montoTotal);
    });

    return Array.from(balanceMap.values());
  }
}