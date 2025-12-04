import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendNewReceiptNotification(saleId: number, userEmail: string) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    await this.transporter.sendMail({
      from: `"PCFIX Ventas" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[ACCIÓN REQUERIDA] Nuevo Pago - Orden #${saleId}`,
      html: `<p>El usuario <strong>${userEmail}</strong> ha subido un comprobante para la <strong>Orden #${saleId}</strong>.</p>`,
    });
  }

  async sendStatusUpdate(clientEmail: string, saleId: number, status: string) {
    await this.transporter.sendMail({
      from: `"PCFIX Clientes" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: `Actualización Orden #${saleId}`,
      html: `<p>Tu orden #${saleId} está: <strong>${status}</strong></p>`,
    });
  }

  async sendDispatchNotification(clientEmail: string, saleId: number, trackingCode: string, carrier: string) {
    const trackingLink = `https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingCode}`;
    await this.transporter.sendMail({
      from: `"PCFIX Logística" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: `🚀 Pedido #${saleId} Despachado`,
      html: `<p>Tu pedido fue enviado por ${carrier}. Tracking: <strong>${trackingCode}</strong>. <a href="${trackingLink}">Seguir envío</a></p>`,
    });
  }

  // 👇 NUEVO MÉTODO: Respuesta de Soporte
  async sendReplyNotification(userEmail: string, subject: string, reply: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Respuesta a tu Consulta Técnica 🔧</h2>
        <p>Hola,</p>
        <p>Hemos respondido a tu consulta sobre: <strong>"${subject}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0; font-style: italic; color: #555;">"${reply}"</p>
        </div>

        <p>Si tienes más dudas, puedes responder a este correo o crear una nueva consulta.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Equipo Técnico de PCFIX.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"PCFIX Soporte" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Respuesta: ${subject}`,
      html,
    });
    
    console.log(`📧 Respuesta de soporte enviada a ${userEmail}`);
  }
}