import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
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

  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      await this.transporter.sendMail({
        from: `"PCFIX Notificaciones" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (error) {
      console.error('🔥 Error enviando email:', error);
      return false;
    }
  }

  // Notificar Consulta
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

  // Notificar Respuesta
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

  // Notificar Comprobante
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

  // Notificar Cambio de Estado
  // Notificar Cambio de Estado
  async sendStatusUpdate(userEmail: string, saleId: number, newStatus: string, tipoEntrega?: string) {
    let mensaje = `El estado de tu pedido cambió a: ${newStatus}`;

    if (newStatus === 'APROBADO') {
      mensaje = '¡Tu pago fue aprobado! Estamos preparando tu pedido.';
    } else if (newStatus === 'PENDIENTE_APROBACION') {
      mensaje = 'Estamos verificando tu pago. Te avisaremos pronto.';
    } else if (newStatus === 'RECHAZADO') {
      mensaje = 'Hubo un problema con tu pago. Por favor revisa el comprobante o contáctanos.';
    } else if (newStatus === 'CANCELADO') {
      mensaje = 'Tu pedido ha sido cancelado.';
    } else if (newStatus === 'ENVIADO') {
      if (tipoEntrega === 'RETIRO') {
        mensaje = '¡Tu pedido está listo para retirar! Te esperamos en nuestro local.';
      } else {
        mensaje = '¡Tu pedido está en camino! Pronto recibirás el código de seguimiento.';
      }
    } else if (newStatus === 'ENTREGADO') {
      mensaje = '¡Gracias por tu compra! Tu pedido figura como entregado/retirado.';
    }

    const subject = `Actualización de Orden #${saleId} - ${mensaje.split('!')[0]}!`; // Basic subject customization

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

  // Notificar Carrito Abandonado
  async sendAbandonedCartEmail(userEmail: string, userName: string, products: any[]) {
    const subject = `👀 ¿Olvidaste algo, ${userName}?`;

    // Find most expensive item for hero image
    const mainProduct = products.sort((a, b) => Number(b.precio) - Number(a.precio))[0];
    const otherCount = products.length - 1;
    const cartLink = `https://pcfixbaru.com.ar/carrito`; // Or localhost if dev

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: #111827; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">PC FIX</h1>
        </div>

        <div style="padding: 30px 20px;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-top: 0; text-align: center;">Tu PC te está esperando 🖥️</h2>
            <p style="text-align: center; color: #4b5563; font-size: 16px; margin-bottom: 30px;">
                Hola <strong>${userName}</strong>, notamos que dejaste hardware de alto rendimiento en tu carrito.
            </p>

            <!-- Hero Product -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px; border: 1px solid #f3f4f6;">
                <img src="${mainProduct.foto || 'https://placehold.co/400x400?text=Hardware'}" alt="${mainProduct.nombre}" style="max-width: 100%; height: auto; max-height: 200px; object-fit: contain; margin-bottom: 15px;">
                <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 18px;">${mainProduct.nombre}</h3>
                <p style="margin: 0; color: #ea580c; font-weight: bold; font-size: 20px;">$${Number(mainProduct.precio).toLocaleString('es-AR')}</p>
                ${otherCount > 0 ? `<p style="margin-top: 10px; font-size: 14px; color: #6b7280;">+ ${otherCount} productos más</p>` : ''}
            </div>

            <!-- Scarcity & CTA -->
            <div style="text-align: center;">
                <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin-bottom: 25px; background-color: #fef2f2; display: inline-block; padding: 6px 12px; border-radius: 9999px;">
                   ⚠️ Reservamos tus productos por tiempo limitado. El stock de hardware cambia rápido.
                </p>
                
                <a href="${cartLink}" style="display: block; width: 100%; background-color: #2563eb; color: #ffffff; padding: 16px 0; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                    Finalizar mi compra ahora
                </a>
                
                <p style="margin-top: 20px; font-size: 14px; color: #9ca3af;">
                    <a href="${cartLink}" style="color: #6b7280; text-decoration: underline;">Volver al carrito</a>
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">PC FIX - Tu tienda de hardware</p>
            <p style="margin: 5px 0;">Si no fuiste tú, puedes ignorar este correo.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  // Notificar Stock
  async sendStockAlertEmail(userEmail: string, productName: string, productLink: string, foto: string, price: number) {
    const subject = `📢 ¡Volvió el stock! ${productName} ya está disponible`;

    const html = `
      <div style="font-family: 'Segoe UI', serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        
        <div style="background-color: #111827; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">PC FIX</h1>
        </div>

        <div style="padding: 30px 20px;">
            <p style="text-align: center; color: #16a34a; font-weight: 700; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; margin-bottom: 5px;">¡Buenas Noticias!</p>
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-top: 0; text-align: center; line-height: 1.3;">${productName}</h2>
            
            <p style="text-align: center; color: #4b5563; font-size: 16px; margin-bottom: 25px;">
                El producto que estabas esperando ya tiene unidades disponibles. Asegúralo antes de que se agote nuevamente.
            </p>

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px; border: 1px solid #f3f4f6;">
                <img src="${foto || 'https://placehold.co/400x400?text=Hardware'}" alt="${productName}" style="max-width: 100%; height: auto; max-height: 200px; object-fit: contain; margin-bottom: 15px;">
                <p style="margin: 0; color: #111827; font-weight: bold; font-size: 24px;">$${Number(price).toLocaleString('es-AR')}</p>
            </div>

            <div style="text-align: center;">
                <a href="${productLink}" style="display: block; width: 100%; background-color: #16a34a; color: #ffffff; padding: 16px 0; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);">
                    Comprar Ahora
                </a>
            </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p>Recibiste este correo porque solicitaste una alerta de stock en PC FIX.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }
}