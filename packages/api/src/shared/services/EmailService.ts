import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true para 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // --- MÉTODO CORE ---
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

  // --- 1. SOPORTE TÉCNICO ---
  async sendReplyNotification(userEmail: string, asuntoOriginal: string, respuestaTecnico: string) {
    const subject = `Respuesta a tu consulta: ${asuntoOriginal}`;
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #1d4ed8;">Soporte Técnico PCFIX</h2>
        <p>Hemos respondido a tu consulta:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong>${asuntoOriginal}</strong><br><br>
          ${respuestaTecnico}
        </div>
        <p style="font-size: 12px; color: #666;">Ingresa a tu cuenta para más detalles.</p>
      </div>
    `;
    return await this.sendEmail(userEmail, subject, html);
  }

  // --- 2. VENTAS: NUEVO COMPROBANTE (Para el Admin) ---
  async sendNewReceiptNotification(saleId: number, userEmail: string) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || ''; 
    const subject = `💸 Nuevo Comprobante Cargado - Orden #${saleId}`;
    
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #16a34a;">Pago Pendiente de Revisión</h2>
        <p>El usuario <strong>${userEmail}</strong> ha subido un comprobante para la orden <strong>#${saleId}</strong>.</p>
        <p>Por favor, ingresa al panel administrativo para validar el pago.</p>
        <a href="http://localhost:4321/admin/ventas" style="background: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Panel</a>
      </div>
    `;
    // Se envía al ADMIN, no al usuario
    return await this.sendEmail(adminEmail, subject, html);
  }

  // --- 3. VENTAS: CAMBIO DE ESTADO (Para el Cliente) ---
  async sendStatusUpdate(userEmail: string, saleId: number, newStatus: string) {
    // Mapeo de estados a textos amigables
    const statusMap: Record<string, string> = {
        'APROBADO': '¡Tu pago fue aprobado! Estamos preparando tu pedido.',
        'RECHAZADO': 'Hubo un problema con tu pago. Por favor contáctanos.',
        'CANCELADO': 'Tu pedido ha sido cancelado.',
        'PENDIENTE_APROBACION': 'Estamos verificando tu pago.'
    };

    const mensaje = statusMap[newStatus] || `El estado de tu pedido cambió a: ${newStatus}`;
    const subject = `Actualización de Orden #${saleId}`;

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #1d4ed8;">Estado de tu Pedido #${saleId}</h2>
        <p>${mensaje}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">Gracias por confiar en PCFIX.</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  // --- 4. VENTAS: ENVÍO DESPACHADO (Para el Cliente) ---
  async sendDispatchNotification(userEmail: string, saleId: number, trackingCode: string) {
    const subject = `🚀 ¡Tu pedido #${saleId} está en camino!`;
    const trackingLink = `https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingCode}`;

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #1d4ed8;">¡Buenas noticias!</h2>
        <p>Tu pedido <strong>#${saleId}</strong> ha sido despachado por Correo Argentino.</p>
        
        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bae6fd;">
            <p style="margin:0;">Código de Seguimiento:</p>
            <h3 style="margin: 5px 0; letter-spacing: 2px;">${trackingCode}</h3>
        </div>

        <a href="${trackingLink}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Seguir Envío
        </a>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }
}