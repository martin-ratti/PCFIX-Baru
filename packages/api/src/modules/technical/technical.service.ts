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
    return { data: items, meta: { total, page, lastPage: Math.ceil(total / limit), limit } };
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

  async deleteInquiry(id: number) {
    // 1. Verificar si existe
    const exists = await prisma.consultaTecnica.findUnique({ where: { id } });
    if (!exists) throw new Error("Consulta no encontrada");

    // 2. Eliminar
    return await prisma.consultaTecnica.delete({
      where: { id }
    });
  }

  // --- PARTE 2: GESTIÓN DE PRECIOS (TARIFAS) ---

  async getServicePrices() {
    return await prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: { id: 'asc' }
    });
  }

  // SINCRONIZACIÓN AUTOMÁTICA CON EL POS
  async updateServicePrice(id: number, price: number) {
    // 1. Actualizamos el Servicio
    const serviceItem = await prisma.serviceItem.update({
      where: { id },
      data: { price }
    });

    const productName = `Servicio: ${serviceItem.title}`;

    const product = await prisma.producto.findFirst({
      where: { nombre: productName }
    });

    if (product) {
      await prisma.producto.update({
        where: { id: product.id },
        data: { precio: price }
      });
    } else {
      console.warn(`⚠️ No se encontró producto POS para el servicio: ${serviceItem.title}`);
    }

    return serviceItem;
  }
}