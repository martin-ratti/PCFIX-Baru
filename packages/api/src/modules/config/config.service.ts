import { prisma } from '../../shared/database/prismaClient';
import axios from 'axios';

export class ConfigService {
  
  async getConfig() {
    let config = await prisma.configuracion.findFirst();
    if (!config) {
      config = await prisma.configuracion.create({
        data: {
          nombreBanco: "Banco Nación",
          titular: "PCFIX S.A.",
          cbu: "0000000000000000000000",
          alias: "PCFIX.VENTAS",
          costoEnvioFijo: 6500,
          cotizacionUsdt: 1200
        }
      });
    }
    return config;
  }

  async updateConfig(data: any) {
    const config = await this.getConfig();
    return await prisma.configuracion.update({
      where: { id: config.id },
      data
    });
  }

  // 👇 LÓGICA ACTUALIZADA: USA P2P
  async syncUsdtPrice() {
    try {
      // 1. Consultamos API de CriptoYa (Excelente para mercado ARS)
      const response = await axios.get('https://criptoya.com/api/usdt/ars/0.1'); 
      
      // 2. Tomamos Binance P2P (El mercado real en Argentina)
      // Usamos 'ask' (Venta) como referencia
      const price = response.data.binancep2p?.ask;

      if (!price || isNaN(price)) throw new Error("Precio inválido recibido de CriptoYa");

      // 3. Guardamos con 2 decimales de precisión
      const precioFinal = Number(Number(price).toFixed(2));

      const config = await prisma.configuracion.findFirst();
      if (config) {
          const updated = await prisma.configuracion.update({
              where: { id: config.id },
              data: { cotizacionUsdt: precioFinal }
          });
          return updated;
      }
      return null;
    } catch (error) {
      console.error("Error obteniendo cotización P2P:", error);
      throw new Error("No se pudo obtener la cotización externa");
    }
  }
}