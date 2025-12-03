import { prisma } from '../../shared/database/prismaClient';

export class ShippingService {
  
    /**
     * Calcula costo basado en CP y peso.
     * Por ahora usa el costo fijo de la configuración + un extra por peso.
     */
    async calculateCost(cpDestino: string, pesoTotal: number) {
      // Obtener costo base configurado por el admin
      const config = await prisma.configuracion.findFirst();
      const basePrice = config ? Number(config.costoEnvioFijo) : 5000;
      
      // Lógica simple de incremento por peso (ej: $500 por cada kg extra)
      const extraPorKilo = 500;
      const pesoExtra = Math.max(0, Math.ceil(pesoTotal) - 1);
      
      const finalCost = basePrice + (pesoExtra * extraPorKilo);
      
      console.log(`🚚 Envío a ${cpDestino} (${pesoTotal}kg) -> $${finalCost}`);
      
      return finalCost;
    }
}