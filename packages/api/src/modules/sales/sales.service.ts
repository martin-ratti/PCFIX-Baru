import { prisma } from '../../shared/database/prismaClient';
import { VentaEstado } from '@prisma/client';

export class SalesService {
  // Crear Venta
  async createSale(userId: number, items: any[], total: number) {
    const cliente = await prisma.cliente.findUnique({ where: { userId } });
    
    // Si no existe el cliente, lo creamos al vuelo (Robustez)
    let finalClienteId = cliente?.id;
    if (!finalClienteId) {
        const newClient = await prisma.cliente.create({ data: { userId } });
        finalClienteId = newClient.id;
    }

    return await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          clienteId: finalClienteId,
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
        
        await tx.producto.update({
          where: { id: Number(item.id) },
          data: { stock: { decrement: item.quantity } }
        });
      }
      
      return venta;
    });
  }

  async uploadReceipt(saleId: number, receiptUrl: string) {
    return await prisma.venta.update({
      where: { id: saleId },
      data: {
        comprobante: receiptUrl,
        estado: VentaEstado.PENDIENTE_APROBACION 
      }
    });
  }

  async updateStatus(saleId: number, status: VentaEstado) {
    return await prisma.venta.update({
      where: { id: saleId },
      data: { estado: status }
    });
  }
  
  async findAll(page: number = 1, limit: number = 10) {
      const skip = (page - 1) * limit;
      const [total, sales] = await prisma.$transaction([
        prisma.venta.count(),
        prisma.venta.findMany({
          include: { 
            cliente: { include: { user: true } },
            // 👇 CORRECCIÓN: Incluir las líneas y los productos
            lineasVenta: { include: { producto: true } } 
          },
          orderBy: { fecha: 'desc' },
          take: limit,
          skip
        })
      ]);
      return { data: sales, meta: { total, page, lastPage: Math.ceil(total/limit), limit } };
  }

  async findById(id: number) {
      return await prisma.venta.findUnique({
          where: { id },
          include: { 
              lineasVenta: { include: { producto: true } },
              cliente: { include: { user: true } }
          }
      });
  }

async findByUserId(userId: number, limit: number = 20) {
    return await prisma.venta.findMany({
      where: { cliente: { userId } },
      include: {
        lineasVenta: { include: { producto: true } }
      },
      orderBy: { fecha: 'desc' },
      take: limit // Limita la cantidad de ventas a traer
    });
  }
}