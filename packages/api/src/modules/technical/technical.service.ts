import { prisma } from '../../shared/database/prismaClient';
import { EmailService } from '../../shared/services/EmailService';
import { EstadoConsulta } from '@prisma/client';

export class TechnicalService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

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

  async findAll(page: number = 1, limit: number = 10) {
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

  // 👇 NUEVO MÉTODO: Obtener consultas de UN usuario
  async findByUserId(userId: number) {
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
}