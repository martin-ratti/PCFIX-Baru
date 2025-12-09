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

  // Notificar Consulta (Admin)
  async sendNewInquiryNotification(userEmail: string, userName: string, subject: string, message: string) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';
    const emailSubject = `🔧 Nueva Consulta Técnica: ${subject}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #111827; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">PC FIX Panel</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #ea580c; margin-top: 0; text-align: center;">Nueva Consulta Recibida</h2>
          <p style="text-align: center; color: #4b5563;">El usuario <strong>${userName}</strong> (<a href="mailto:${userEmail}" style="color: #2563eb;">${userEmail}</a>)</p>
          
          <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffedd5;">
            <p style="margin: 0 0 10px 0; color: #9a3412;"><strong>Asunto:</strong> ${subject}</p>
            <p style="margin: 0; font-style: italic; color: #431407;">"${message}"</p>
          </div>

          <div style="text-align: center;">
            <a href="http://localhost:4321/admin/soporte" style="background: #1f2937; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Responder en Panel</a>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(adminEmail, emailSubject, html);
  }

  // Notificar Respuesta (Usuario)
  async sendReplyNotification(userEmail: string, asuntoOriginal: string, respuestaTecnico: string) {
    const subject = `Respuesta a tu consulta: ${asuntoOriginal}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #111827; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">PC FIX Soporte</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #1d4ed8; margin-top: 0; text-align: center;">Respuesta a tu Consulta</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Tu consulta:</p>
            <strong style="display:block; margin-bottom: 20px; color: #111827;">${asuntoOriginal}</strong>
            
            <hr style="border: 0; border-top: 1px solid #d1d5db; margin: 15px 0;">
            
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Respuesta del Técnico:</p>
            <p style="margin: 0; line-height: 1.6; color: #374151;">${respuestaTecnico}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:4321/mis-consultas" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Mis Consultas</a>
            <p style="font-size: 13px; color: #9ca3af; margin-top: 15px;">Puedes responder nuevamente desde tu perfil.</p>
          </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">PC FIX - Experiencia en Hardware</p>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  // Notificar Comprobante (Admin)
  async sendNewReceiptNotification(saleId: number, userEmail: string) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';
    const subject = `💸 Nuevo Comprobante - Orden #${saleId}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #111827; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">PC FIX Ventas</h1>
        </div>
        
        <div style="padding: 30px; text-align: center;">
          <div style="background: #dcfce7; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px auto; line-height: 80px; text-align: center;">
             <span style="font-size: 40px; vertical-align: middle;">💰</span>
          </div>
          
          <h2 style="color: #16a34a; margin-top: 0;">Pago Pendiente de Revisión</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">El usuario <strong>${userEmail}</strong> ha subido un comprobante para la orden <strong style="color: #111;">#${saleId}</strong>.</p>
          
          <div style="margin-top: 30px;">
            <a href="http://localhost:4321/admin/ventas" style="background: #1f2937; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Administrar Venta</a>
          </div>
        </div>
      </div>
    `;
    return await this.sendEmail(adminEmail, subject, html);
  }

  // Notificar Cambio de Estado (Usuario)
  async sendStatusUpdate(userEmail: string, saleId: number, newStatus: string, tipoEntrega?: string) {
    let mensaje = 'El estado de tu pedido ha cambiado.';
    let icon = '📦';
    let color = '#2563eb';

    if (newStatus === 'APROBADO') {
      mensaje = '¡Tu pago ha sido aprobado! 🎉<br>Ya estamos preparando tu pedido para despacharlo.';
      icon = '✅';
      color = '#16a34a';
    } else if (newStatus === 'PENDIENTE_APROBACION') {
      mensaje = 'Recibimos tu comprobante. 📄<br>Nuestro equipo está verificando el pago, te avisaremos apenas se confirme.';
      icon = '⏳';
      color = '#ca8a04';
    } else if (newStatus === 'RECHAZADO') {
      mensaje = 'No pudimos verificar tu pago. ⚠️<br>Por favor revisa el comprobante subido o contáctanos para solucionarlo.';
      icon = '❌';
      color = '#dc2626';
    } else if (newStatus === 'CANCELADO') {
      mensaje = 'Tu pedido ha sido cancelado. 🚫<br>Si crees que esto es un error, por favor contáctanos.';
      icon = '🚫';
      color = '#ef4444';
    } else if (newStatus === 'ENVIADO') {
      if (tipoEntrega === 'RETIRO') {
        mensaje = '¡Tu pedido está listo para retirar! 🛍️<br>Te esperamos en nuestro local con tu número de orden.';
        icon = '🏪';
      } else {
        mensaje = '¡Tu pedido está en camino! 🚚<br>Pronto recibirás el código de seguimiento para rastrear tu paquete.';
        icon = '🚚';
      }
      color = '#2563eb';
    } else if (newStatus === 'ENTREGADO') {
      mensaje = '¡Gracias por confiar en PC FIX! ❤️<br>Tu pedido figura como completado. ¡Esperamos que disfrutes tu hardware!';
      icon = '🚀';
      color = '#7c3aed';
    }

    const subject = `Actualización de Orden #${saleId} - PC FIX`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #111827; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">PC FIX</h1>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
             <!-- Centered Icon using line-height technique -->
             <div style="background: ${color}15; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 25px auto; line-height: 80px; text-align: center;">
               <span style="font-size: 40px; vertical-align: middle;">${icon}</span>
             </div>

            <h2 style="color: ${color}; margin-top: 0; font-size: 24px;">Estado Actualizado</h2>
            <p style="font-size: 18px; margin: 0 0 10px 0; font-weight: bold;">Orden #${saleId}</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-top: 20px;">${mensaje}</p>

            <div style="margin-top: 35px;">
              <a href="http://localhost:4321/mis-compras" style="background: ${color}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px ${color}50;">
                Ver Detalles del Pedido
              </a>
            </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">Gracias por confiar en PC FIX.</p>
        </div>
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
    // ... existing logic ...
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

  // Notificar Bienvenida
  async sendWelcomeEmail(email: string, name: string) {
    const subject = '¡Bienvenido a la comunidad PCFIX! 🚀';
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: #111827; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">PC FIX</h1>
            <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 14px;">Tu experto en hardware</p>
        </div>

        <div style="padding: 40px 30px;">
            <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; text-align: center;">¡Hola, ${name}! 👋</h1>
            
            <p style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Gracias por unirte a <strong>PCFIX</strong>. Ya eres parte de nuestra comunidad de entusiastas del hardware y la tecnología.
            </p>

            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin-top: 0; color: #111827; font-size: 18px;">¿Qué puedes hacer ahora?</h3>
                <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
                    <li style="margin-bottom: 10px;">🚀 Explorar las últimas novedades en hardware.</li>
                    <li style="margin-bottom: 10px;">📦 Seguir tus pedidos en tiempo real.</li>
                    <li style="margin-bottom: 10px;">💡 Recibir asesoramiento técnico personalizado.</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="https://pcfixbaru.com.ar" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
                    Ir a la Tienda
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} PC FIX. Todos los derechos reservados.</p>
            <div style="margin-top: 10px;">
                <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Instagram</a>
                <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Facebook</a>
                <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Web</a>
            </div>
        </div>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  // Notificar Reset Password
  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const subject = '🔐 Recuperación de Contraseña - PCFIX';

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: #111827; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">PC FIX</h1>
        </div>

        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <span style="font-size: 48px;">🔒</span>
            </div>
            
            <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; text-align: center;">Restablecer Contraseña</h2>
            
            <p style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Recibimos una solicitud para cambiar tu contraseña. Si fuiste tú, puedes crear una nueva haciendo clic en el botón de abajo.
            </p>

            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                    Restablecer Contraseña
                </a>
            </div>

            <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #c2410c;">
                    ⚠️ Este enlace expirará en 1 hora por seguridad.
                </p>
            </div>
            
            <p style="margin-top: 30px; font-size: 13px; color: #6b7280; text-align: center;">
                Si tienes problemas con el botón, copia el siguiente enlace:<br>
                <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
            </p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(email, subject, html);
  }
}