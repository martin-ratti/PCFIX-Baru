import cron from 'node-cron';
import { ConfigService } from '../../modules/config/config.service';

const configService = new ConfigService();

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
}