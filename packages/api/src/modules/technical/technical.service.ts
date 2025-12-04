import { prisma } from '../../shared/database/prismaClient';
import { EmailService } from '../../shared/services/EmailService';
import { EstadoConsulta } from '@prisma/client';

export class TechnicalService {
  private emailService: EmailService;

  constructor() {
    // Inicializamos el servicio de email (que usa nodemailer internamente)
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
    // 1. Actualizar en Base de Datos
    const consulta = await prisma.consultaTecnica.update({
        where: { id },
        data: {
            respuesta,
            estado: EstadoConsulta.RESPONDIDO, // Asegura que el estado cambie
            respondedAt: new Date()
        },
        include: { user: true } // Necesitamos el usuario para obtener su email
    });

    // 2. Enviar Notificación por Email (Segundo plano)
    if (consulta.user && consulta.user.email) {
        console.log(`📧 Intentando notificar respuesta a: ${consulta.user.email}`);
        
        // No usamos 'await' aquí para no hacer esperar al admin en la UI si el SMTP tarda
        this.emailService.sendReplyNotification(
            consulta.user.email, 
            consulta.asunto, 
            respuesta
        )
        .then(success => {
            if(success) console.log("✅ Email enviado correctamente.");
            else console.warn("⚠️ El email no se pudo enviar (ver logs de EmailService).");
        })
        .catch(err => console.error("🔥 Error crítico enviando email:", err));
    } else {
        console.warn("⚠️ No se envió email: El usuario no tiene correo registrado.");
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

  async updateServicePrice(id: number, price: number) {
    return await prisma.serviceItem.update({
      where: { id },
      data: { price }
    });
  }
}