import { prisma } from '../../shared/database/prismaClient';
import { EmailService } from '../../shared/services/EmailService';

export class TechnicalService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  

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
        orderBy: [
          { estado: 'asc' }, 
          { createdAt: 'desc' }
        ],
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
      data: { respuesta, estado: 'RESPONDIDO', respondedAt: new Date() },
      include: { user: true }
    });

    if (consulta.user?.email) {
      this.emailService.sendReplyNotification(consulta.user.email, consulta.asunto, respuesta)
        .catch((err: any) => console.error("Fallo al enviar email de respuesta:", err));
    }
    return consulta;
  }

  async deleteInquiry(id: number) {
    
    const exists = await prisma.consultaTecnica.findUnique({ where: { id } });
    if (!exists) throw new Error("Consulta no encontrada");

    
    return await prisma.consultaTecnica.delete({
      where: { id }
    });
  }

  

  async getServicePrices() {
    return await prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: { id: 'asc' }
    });
  }

  
  async updateServicePrice(id: number, price: number) {
    
    const serviceItem = await prisma.serviceItem.update({
      where: { id },
      data: { price }
    });

    const productName = serviceItem.title;

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