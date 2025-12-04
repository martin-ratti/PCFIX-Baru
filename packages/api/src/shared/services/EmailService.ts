import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    // Configuración del transporte SMTP (Gmail)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true para puerto 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // --- MÉTODO BASE (Privado o Público según necesidad) ---
  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"PCFIX Notificaciones" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`📧 Email enviado a ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('🔥 Error enviando email:', error);
      return false;
    }
  }

  // ==========================================
  //      MÉTODOS DE SOPORTE TÉCNICO
  // ==========================================

  // 1. Notificar al Admin de una NUEVA consulta (User -> Admin)
  async sendNewInquiryNotification(userEmail: string, userName: string, subject: string, message: string) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';
    const emailSubject = `🔧 Nueva Consulta Técnica: ${subject}`;

    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px;">
        <h2 style="color: #ea580c;">Nueva Consulta Recibida</h2>
        <p>El usuario <strong>${userName}</strong> (<a href="mailto:${userEmail}">${userEmail}</a>) ha enviado una consulta:</p>
        
        <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #ffedd5;">
          <p style="margin: 0 0 10px 0;"><strong>Asunto:</strong> ${subject}</p>
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>

        <a href="http://localhost:4321/admin/soporte" style="background: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Responder en Panel</a>
      </div>
    `;

    return await this.sendEmail(adminEmail, emailSubject, html);
  }

  // 2. Notificar al Usuario de una RESPUESTA (Admin -> User)
  async sendReplyNotification(userEmail: string, asuntoOriginal: string, respuestaTecnico: string) {
    const subject = `Respuesta a tu consulta: ${asuntoOriginal}`;
    
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px;">
        <h2 style="color: #1d4ed8;">Soporte Técnico PCFIX</h2>
        <p>Nuestro equipo ha respondido a tu consulta:</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Tu consulta:</p>
          <strong style="display:block; margin-bottom: 15px;">${asuntoOriginal}</strong>
          <hr style="border: 0; border-top: 1px solid #d1d5db; margin: 10px 0;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Respuesta:</p>
          <p style="margin: 0; line-height: 1.5;">${respuestaTecnico}</p>
        </div>

        <p style="font-size: 12px; color: #666;">Puedes ver el historial completo en tu perfil.</p>
        <a href="http://localhost:4321/mis-consultas" style="color: #1d4ed8; text-decoration: none; font-weight: bold;">Ir a Mis Consultas &rarr;</a>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  // ==========================================
  //           MÉTODOS DE VENTAS
  // ==========================================

  // 3. Notificar al Admin de un COMPROBANTE SUBIDO (User -> Admin)
  async sendNewReceiptNotification(saleId: number, userEmail: string) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || ''; 
    const subject = `💸 Nuevo Comprobante - Orden #${saleId}`;
    
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #16a34a;">Pago Pendiente de Revisión</h2>
        <p>El usuario <strong>${userEmail}</strong> ha subido un comprobante para la orden <strong>#${saleId}</strong>.</p>
        <p>Por favor, ingresa al panel administrativo para validar el pago.</p>
        <a href="http://localhost:4321/admin/ventas" style="background: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ir a Ventas</a>
      </div>
    `;
    return await this.sendEmail(adminEmail, subject, html);
  }

  // 4. Notificar al Cliente cambio de ESTADO (Admin -> User)
  async sendStatusUpdate(userEmail: string, saleId: number, newStatus: string) {
    const statusMap: Record<string, string> = {
        'APROBADO': '¡Tu pago fue aprobado! Estamos preparando tu pedido.',
        'RECHAZADO': 'Hubo un problema con tu pago. Por favor revisa el comprobante o contáctanos.',
        'CANCELADO': 'Tu pedido ha sido cancelado.',
        'PENDIENTE_APROBACION': 'Estamos verificando tu pago. Te avisaremos pronto.'
    };

    const mensaje = statusMap[newStatus] || `El estado de tu pedido cambió a: ${newStatus}`;
    const subject = `Actualización de Orden #${saleId}`;

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #1d4ed8;">Estado de tu Pedido #${saleId}</h2>
        <p style="font-size: 16px;">${mensaje}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Gracias por confiar en PCFIX.</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  // 5. Notificar al Cliente de DESPACHO (Admin -> User)
  async sendDispatchNotification(userEmail: string, saleId: number, trackingCode: string) {
    const subject = `🚀 ¡Tu pedido #${saleId} está en camino!`;
    const trackingLink = `https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingCode}`;

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #1d4ed8;">¡Buenas noticias!</h2>
        <p>Tu pedido <strong>#${saleId}</strong> ha sido despachado por Correo Argentino.</p>
        
        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bae6fd; text-align: center;">
            <p style="margin:0; font-size: 12px; text-transform: uppercase; color: #0369a1;">Código de Seguimiento</p>
            <h3 style="margin: 5px 0; letter-spacing: 2px; font-size: 24px; color: #0c4a6e;">${trackingCode}</h3>
        </div>

        <div style="text-align: center;">
            <a href="${trackingLink}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Seguir Envío
            </a>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }
}