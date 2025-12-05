import { prisma } from '../../shared/database/prismaClient';
import { EmailService } from '../../shared/services/EmailService';
import { EstadoConsulta } from '@prisma/client';

export class TechnicalService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // --- PARTE 1: CONSULTAS TÉCNICAS ---

  async createInquiry(userId: number, asunto: string, mensaje: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Usuario no encontrado");

    const inquiry = await prisma.consultaTecnica.create({
      data: { userId, asunto, mensaje, estado: 'PENDIENTE' }
    });

    if (user.email) {
        this.emailService.sendNewInquiryNotification(
            user.email, user.nombre || 'Usuario', asunto, mensaje
        ).catch((err: any) => console.error("Fallo email nueva consulta:", err));
    }
    return inquiry;
  }

  async findAllInquiries(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [total, items] = await prisma.$transaction([
        prisma.consultaTecnica.count(),
        prisma.consultaTecnica.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
        })
    ]);
    return { data: items, meta: { total, page, lastPage: Math.ceil(total/limit), limit } };
  }

  async findInquiriesByUserId(userId: number) {
    return await prisma.consultaTecnica.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
  }

  async replyInquiry(id: number, respuesta: string) {
    const consulta = await prisma.consultaTecnica.update({
        where: { id },
        data: { respuesta, estado: EstadoConsulta.RESPONDIDO, respondedAt: new Date() },
        include: { user: true }
    });

    if (consulta.user?.email) {
        this.emailService.sendReplyNotification(consulta.user.email, consulta.asunto, respuesta)
            .catch((err: any) => console.error("Fallo al enviar email de respuesta:", err));
    }
    return consulta;
  }

  // --- PARTE 2: GESTIÓN DE PRECIOS (TARIFAS) ---

  async getServicePrices() {
    return await prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: { id: 'asc' }
    });
  }

  // 👇 AQUÍ ESTÁ LA MAGIA DE LA SINCRONIZACIÓN
  async updateServicePrice(id: number, price: number) {
    // 1. Actualizamos el Servicio (Lo que se ve en la web pública)
    const serviceItem = await prisma.serviceItem.update({
      where: { id },
      data: { price }
    });

    // 2. SINCRONIZACIÓN AUTOMÁTICA CON EL POS
    // Buscamos el producto que corresponde a este servicio
    // Convención: El producto se llama "Servicio: " + Titulo del servicio
    const productName = `Servicio: ${serviceItem.title}`;
    
    const product = await prisma.producto.findFirst({
        where: { nombre: productName }
    });

    if (product) {
        console.log(`🔄 Sincronizando precio POS para "${productName}": $${product.precio} -> $${price}`);
        await prisma.producto.update({
            where: { id: product.id },
            data: { precio: price } // Actualizamos el precio en la tabla de productos
        });
    } else {
        console.warn(`⚠️ No se encontró producto POS para el servicio: ${serviceItem.title}`);
    }

    return serviceItem;
  }
}