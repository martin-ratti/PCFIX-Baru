import cron from 'node-cron';
import { ConfigService } from '../../modules/config/config.service';
import { EmailService } from './EmailService';
import { prisma } from '../../shared/database/prismaClient';

const configService = new ConfigService();
const emailService = new EmailService();

export class CronService {

  start() {
    // Cron: Actualizar USDT cada 4 horas "0 */4 * * *"
    cron.schedule('0 */4 * * *', async () => {
      try {
        const result = await configService.syncUsdtPrice();

        if (!result) {
          console.warn('⚠️ Cron: No se pudo obtener la cotización (API externa sin datos)');
        }

      } catch (error) {
        console.error('❌ Cron Error: No se pudo actualizar USDT', error);
      }
    });

    // Cron: Carritos Abandonados (Cada 30 minutos)
    cron.schedule('*/30 * * * *', async () => {

      await this.checkAbandonedCarts();
    });

    this.runInitialSync();
  }

  private async runInitialSync() {
    setTimeout(async () => {
      try {
        await configService.syncUsdtPrice();
      } catch (e) {
        console.error('❌ Error sync inicial USDT');
      }
    }, 5000);
  }

  private async checkAbandonedCarts() {
    try {
      // 30 minutos de inactividad
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const carts = await (prisma as any).cart.findMany({
        where: {
          updatedAt: {
            lt: thirtyMinutesAgo,
            gt: twentyFourHoursAgo
          },
          abandonedEmailSent: false,
          items: { some: {} }, // Tiene items
          userId: { not: undefined } // Tiene usuario (aunque el schema lo hace obligatorio unique, pero por seguridad)
        },
        include: {
          user: true,
          items: { include: { producto: true } }
        }
      });

      if (carts.length > 0) {

      }

      for (const cart of carts) {
        if (!cart.user?.email) continue;

        const products = cart.items.map((i: any) => i.producto);
        const sent = await emailService.sendAbandonedCartEmail(cart.user.email, cart.user.nombre, products);

        if (sent) {
          await (prisma as any).cart.update({
            where: { id: cart.id },
            data: { abandonedEmailSent: true }
          });

        }
      }
    } catch (error) {
      console.error('❌ Error en Cron de Carritos Abandonados:', error);
    }
  }
}