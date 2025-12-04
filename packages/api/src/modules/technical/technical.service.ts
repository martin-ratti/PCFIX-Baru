import { prisma } from '../../shared/database/prismaClient';
import { EmailService } from '../../shared/services/EmailService';
import { EstadoConsulta } from '@prisma/client';

export class TechnicalService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // ==========================================
  //           CONSULTAS TÉCNICAS
  // ==========================================

  // 1. Crear Consulta (Usuario) -> Notifica Admin
  async createInquiry(userId: number, asunto: string, mensaje: string) {
    // Primero obtenemos el usuario para saber su email/nombre
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Usuario no encontrado");

    // Guardamos en DB
    const inquiry = await prisma.consultaTecnica.create({
      data: {
        userId,
        asunto,
        mensaje,
        estado: 'PENDIENTE'
      }
    });

    // Notificamos al Admin (Fire & Forget: no esperamos a que termine para responder al usuario)
    if (user.email) {
        console.log(`📧 Notificando nueva consulta de: ${user.email}`);
        this.emailService.sendNewInquiryNotification(
            user.email,
            user.nombre || 'Usuario',
            asunto,
            mensaje
        ).catch((err: any) => console.error("Fallo email nueva consulta:", err));
    }

    return inquiry;
  }

  // 2. Obtener todas (Admin)
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

  // 3. Obtener propias (Usuario)
  async findInquiriesByUserId(userId: number) {
    return await prisma.consultaTecnica.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
  }

  // 4. Responder Consulta (Admin) -> Notifica Usuario
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

    if (consulta.user && consulta.user.email) {
        console.log(`📧 Enviando respuesta a: ${consulta.user.email}`);
        this.emailService.sendReplyNotification(
            consulta.user.email, 
            consulta.asunto, 
            respuesta
        ).catch((err: any) => console.error("Fallo al enviar email de respuesta:", err));
    }

    return consulta;
  }

  // ==========================================
  //        GESTIÓN DE PRECIOS (TARIFAS)
  // ==========================================

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