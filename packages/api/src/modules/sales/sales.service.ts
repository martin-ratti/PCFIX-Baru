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

  // 1. CREAR VENTA (Checkout)
  async createSale(userId: number, items: any[], subtotal: number, cpDestino?: string) {
    
    // Autoreparación: Buscar o crear perfil de cliente
    let cliente = await prisma.cliente.findUnique({ where: { userId } });
    if (!cliente) {
      cliente = await prisma.cliente.create({ data: { userId } });
    }

    // A. Calcular Peso Total para Envío
    let pesoTotal = 0;
    const productIds = items.map((i: any) => Number(i.id));
    
    // Consultamos DB para obtener pesos reales (seguridad)
    const dbProducts = await prisma.producto.findMany({
        where: { id: { in: productIds } },
        select: { id: true, peso: true }
    });

    items.forEach((item: any) => {
        const p = dbProducts.find(dbp => dbp.id === Number(item.id));
        // Fallback: Si no tiene peso, usamos 0.5kg para evitar NaN
        const pesoUnitario = (p && p.peso) ? Number(p.peso) : 0.5; 
        pesoTotal += pesoUnitario * item.quantity;
    });

    // B. Cotizar Envío
    let costoEnvio = 0;
    if (cpDestino) {
        costoEnvio = await this.shippingService.calculateCost(cpDestino, pesoTotal);
    } else {
        // Fallback a costo fijo si no hay CP (raro en este punto)
        const config = await prisma.configuracion.findFirst();
        costoEnvio = config ? Number(config.costoEnvioFijo) : 5000;
    }

    const finalTotal = subtotal + costoEnvio;

    // C. Transacción Atómica
    return await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          clienteId: cliente!.id,
          montoTotal: finalTotal,
          costoEnvio: costoEnvio,
          metodoEnvio: "CORREO_ARGENTINO",
          estado: VentaEstado.PENDIENTE_PAGO
        }
      });

      for (const item of items) {
        await tx.lineaVenta.create({
          data: {
            ventaId: venta.id,
            productoId: Number(item.id),
            cantidad: item.quantity,
            subTotal: item.price * item.quantity
          }
        });
        
        // Descontar Stock
        await tx.producto.update({
          where: { id: Number(item.id) },
          data: { stock: { decrement: item.quantity } }
        });
      }
      
      return venta;
    });
  }

  // 2. SUBIR COMPROBANTE
  async uploadReceipt(saleId: number, receiptUrl: string) {
    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: {
        comprobante: receiptUrl,
        estado: VentaEstado.PENDIENTE_APROBACION 
      },
      include: { cliente: { include: { user: true } } }
    });

    // Notificar Admin
    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendNewReceiptNotification(saleId, updatedSale.cliente.user.email)
            .catch(err => console.error("Fallo enviando email admin:", err));
    }

    return updatedSale;
  }

  // 3. ADMIN: APROBAR / RECHAZAR
  async updateStatus(saleId: number, status: VentaEstado) {
    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: { estado: status },
      include: { cliente: { include: { user: true } } }
    });

    // Notificar Cliente
    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendStatusUpdate(updatedSale.cliente.user.email, saleId, status)
            .catch(err => console.error("Fallo enviando email cliente:", err));
    }

    return updatedSale;
  }

  // 4. ADMIN: DESPACHAR (Tracking)
  async dispatchSale(saleId: number, trackingCode: string) {
    const sale = await prisma.venta.findUnique({ where: { id: saleId } });
    if (!sale) throw new Error("Venta no encontrada");
    if (sale.estado !== VentaEstado.APROBADO) throw new Error("La venta debe estar APROBADO para despacharse");

    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: {
        estado: VentaEstado.ENVIADO,
        codigoSeguimiento: trackingCode
      },
      include: { cliente: { include: { user: true } } }
    });

    // Notificar Cliente con Tracking
    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendDispatchNotification(
            updatedSale.cliente.user.email, 
            saleId, 
            trackingCode, 
            "Correo Argentino"
        ).catch(console.error);
    }

    return updatedSale;
  }
  
  // 5. ADMIN: LISTAR TODO (Paginado)
  async findAll(page: number = 1, limit: number = 10) {
      const skip = (page - 1) * limit;
      const [total, sales] = await prisma.$transaction([
        prisma.venta.count(),
        prisma.venta.findMany({
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
          include: { 
              lineasVenta: { include: { producto: true } },
              cliente: { include: { user: true } }
          }
      });
  }

  // 7. CLIENTE: MIS COMPRAS
  async findByUserId(userId: number, limit: number = 20) {
    return await prisma.venta.findMany({
      where: { cliente: { userId } },
      include: {
        lineasVenta: { include: { producto: true } }
      },
      orderBy: { fecha: 'desc' },
      take: limit
    });
  }
}