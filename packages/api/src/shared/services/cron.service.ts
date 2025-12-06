import cron from 'node-cron';
import { ConfigService } from '../../modules/config/config.service';

const configService = new ConfigService();

export class CronService {
  
  start() {
    console.log('⏰ Sistema de Cron Jobs iniciado');

    // Tarea: Actualizar USDT cada 4 horas
    // Patrón: "0 */4 * * *" (Minuto 0, cada 4 horas)
    cron.schedule('0 */4 * * *', async () => {
      console.log('🔄 Cron: Actualizando cotización USDT...');
      try {
        const result = await configService.syncUsdtPrice();
        
        // 👇 CORRECCIÓN: Verificamos si result existe antes de usarlo
        if (result) {
            console.log(`✅ Cron: USDT actualizado a $${result.cotizacionUsdt}`);
        } else {
            console.warn('⚠️ Cron: No se pudo obtener la cotización (API externa sin datos)');
        }

      } catch (error) {
        console.error('❌ Cron Error: No se pudo actualizar USDT', error);
      }
    });
    
    // Ejecutar una vez al inicio (con delay para dar tiempo a la DB)
    this.runInitialSync();
  }

  private async runInitialSync() {
      setTimeout(async () => {
          try {
              console.log('🔄 Inicio: Verificando cotización USDT...');
              const result = await configService.syncUsdtPrice();
              
              if (result) {
                  console.log(`✅ Inicio: USDT actualizado a $${result.cotizacionUsdt}`);
              }
          } catch(e) { 
              console.error('❌ Error sync inicial USDT'); 
          }
      }, 5000); 
  }
}