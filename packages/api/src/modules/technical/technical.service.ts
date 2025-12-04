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
    return await prisma.consultaTecnica.create({
      data: {
        userId,
        asunto,
        mensaje,
        estado: 'PENDIENTE'
      }
    });
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
        data: {
            respuesta,
            estado: EstadoConsulta.RESPONDIDO,
            respondedAt: new Date()
        },
        include: { user: true }
    });

    if (consulta.user.email) {
        this.emailService.sendReplyNotification(
            consulta.user.email, 
            consulta.asunto, 
            respuesta
        ).catch(err => console.error("Fallo al enviar email de soporte:", err));
    }

    return consulta;
  }

  // --- PARTE 2: GESTIÓN DE PRECIOS (NUEVO) ---

  async getServicePrices() {
    return await prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: { id: 'asc' }
    });
  }

  async updateServicePrice(id: number, price: number) {
    return await prisma.serviceItem.update({
      where: { id },
      data: { price }
    });
  }
}