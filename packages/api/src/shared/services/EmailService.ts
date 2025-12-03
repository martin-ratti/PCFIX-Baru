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
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #121D40;">🚀 Nuevo Comprobante</h2>
        <p>El usuario <strong>${userEmail}</strong> ha subido comprobante para la <strong>Orden #${saleId}</strong>.</p>
        <a href="http://localhost:4321/admin/ventas">Ir al Panel Admin</a>
      </div>`;

    await this.transporter.sendMail({
      from: `"PCFIX Ventas" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[ACCIÓN REQUERIDA] Pago Orden #${saleId}`,
      html,
    });
  }

  async sendStatusUpdate(clientEmail: string, saleId: number, status: string) {
    const isApproved = status === 'APROBADO';
    const color = isApproved ? '#16a34a' : '#dc2626';
    const title = isApproved ? '¡Pago Aprobado!' : 'Problema con tu Pago';
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: ${color};">${title}</h2>
        <p>Tu <strong>Orden #${saleId}</strong> ahora está: <strong>${status}</strong>.</p>
      </div>`;

    await this.transporter.sendMail({
      from: `"PCFIX Clientes" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: `Actualización Orden #${saleId}`,
      html,
    });
  }

  // 👇 NUEVO MÉTODO: Notificación de Envío
  async sendDispatchNotification(clientEmail: string, saleId: number, trackingCode: string, carrier: string) {
    // Aquí podrías cambiar la URL base según el carrier (OCA, Andreani, etc.)
    const trackingLink = `https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingCode}`; 
    
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a; text-align: center;">¡Tu pedido está en camino! 🚚</h2>
        <p>Hola,</p>
        <p>Tu <strong>Orden #${saleId}</strong> ha sido despachada por <strong>${carrier}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase;">Código de Seguimiento</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-family: monospace; font-weight: bold;">${trackingCode}</p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
            <a href="${trackingLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Seguir Envío</a>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center;">Gracias por elegir PCFIX.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"PCFIX Logística" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: `🚀 Pedido #${saleId} Despachado`,
      html,
    });
  }
}