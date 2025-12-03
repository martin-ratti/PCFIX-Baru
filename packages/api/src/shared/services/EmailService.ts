import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 1. Notificar al Admin sobre nueva venta (Comprobante subido)
  async sendNewReceiptNotification(saleId: number, userEmail: string) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #121D40;">🚀 Nuevo Comprobante de Pago</h2>
        <p>El usuario <strong>${userEmail}</strong> ha subido un comprobante para la <strong>Orden #${saleId}</strong>.</p>
        <p>Por favor ingresa al panel de administración para validarlo.</p>
        <a href="http://localhost:4321/admin/ventas" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Ir al Panel Admin</a>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"PCFIX Ventas" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[ACCIÓN REQUERIDA] Nuevo Pago - Orden #${saleId}`,
      html,
    });
    
    console.log(`📧 Email enviado al Admin por Orden #${saleId}`);
  }

  // 2. Notificar al Cliente sobre cambio de estado (Aprobado/Rechazado)
  async sendStatusUpdate(clientEmail: string, saleId: number, status: string) {
    const isApproved = status === 'APROBADO';
    const color = isApproved ? '#16a34a' : '#dc2626'; // Verde o Rojo
    const title = isApproved ? '¡Pago Aprobado! 🎉' : 'Problema con tu Pago ⚠️';
    const message = isApproved 
      ? 'Tu pago ha sido verificado correctamente. Estamos preparando tu pedido para el envío.' 
      : 'Hubo un problema verificando tu comprobante. Por favor ponte en contacto con nosotros o intenta subirlo nuevamente.';

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: ${color};">${title}</h2>
        <p>Hola,</p>
        <p>El estado de tu <strong>Orden #${saleId}</strong> ha cambiado a: <strong style="color: ${color}">${status}</strong>.</p>
        <p style="font-size: 16px; padding: 10px 0;">${message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Gracias por confiar en PCFIX.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"PCFIX Atencíon al Cliente" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: `Actualización de Orden #${saleId}: ${status}`,
      html,
    });

    console.log(`📧 Email enviado al Cliente (${clientEmail}) por Orden #${saleId}`);
  }
}