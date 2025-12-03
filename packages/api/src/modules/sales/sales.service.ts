import { prisma } from '../../shared/database/prismaClient';
import { VentaEstado } from '@prisma/client';
// Asegúrate de tener creado el EmailService que hicimos en la Fase 33
import { EmailService } from '../../shared/services/EmailService';

export class SalesService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // 1. CREAR VENTA (Checkout Inicial)
  async createSale(userId: number, items: any[], total: number) {
    // Buscamos el cliente o lo creamos si no existe (Robustez)
    let cliente = await prisma.cliente.findUnique({ where: { userId } });
    
    if (!cliente) {
      cliente = await prisma.cliente.create({ data: { userId } });
    }

    // Transacción: Crea venta, líneas y descuenta stock atómicamente
    return await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          clienteId: cliente!.id,
          montoTotal: total,
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
        
        // Descontar stock
        await tx.producto.update({
          where: { id: Number(item.id) },
          data: { stock: { decrement: item.quantity } }
        });
      }
      
      return venta;
    });
  }

  // 2. SUBIR COMPROBANTE (Usuario paga -> Notificar Admin)
  async uploadReceipt(saleId: number, receiptUrl: string) {
    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: {
        comprobante: receiptUrl,
        estado: VentaEstado.PENDIENTE_APROBACION 
      },
      include: {
        cliente: { include: { user: true } }
      }
    });

    // 📧 EMAIL AL ADMIN: "Hay un nuevo pago para revisar"
    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendNewReceiptNotification(saleId, updatedSale.cliente.user.email)
            .catch(err => console.error("Fallo enviando email admin:", err));
    }

    return updatedSale;
  }

  // 3. ACTUALIZAR ESTADO (Admin aprueba/rechaza -> Notificar Cliente)
  async updateStatus(saleId: number, status: VentaEstado) {
    const updatedSale = await prisma.venta.update({
      where: { id: saleId },
      data: { estado: status },
      include: {
        cliente: { include: { user: true } }
      }
    });

    // 📧 EMAIL AL CLIENTE: "Tu pago fue aprobado/rechazado"
    if (updatedSale.cliente?.user?.email) {
        this.emailService.sendStatusUpdate(updatedSale.cliente.user.email, saleId, status)
            .catch(err => console.error("Fallo enviando email cliente:", err));
    }

    return updatedSale;
  }
  
  // 4. LISTAR TODAS (Para el Admin - Optimizado)
  async findAll(page: number = 1, limit: number = 10) {
      const skip = (page - 1) * limit;
      const [total, sales] = await prisma.$transaction([
        prisma.venta.count(),
        prisma.venta.findMany({
          include: { 
            cliente: { include: { user: true } },
            // 👇 ESTO FUE EL "ÚLTIMO CAMBIO":
            // Incluimos los productos (lineasVenta) para que el Modal de Detalle pueda mostrarlos
            lineasVenta: { include: { producto: true } } 
          },
          orderBy: { fecha: 'desc' },
          take: limit,
          skip
        })
      ]);
      return { data: sales, meta: { total, page, lastPage: Math.ceil(total/limit), limit } };
  }

  // 5. BUSCAR UNA (Para el Checkout)
  async findById(id: number) {
      return await prisma.venta.findUnique({
          where: { id },
          include: { 
              lineasVenta: { include: { producto: true } },
              cliente: { include: { user: true } }
          }
      });
  }

  // 6. MIS COMPRAS (Para el Cliente)
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