import { prisma } from '../../shared/database/prismaClient';

export class ConfigService {
  async getConfig() {
    // Buscamos la primera configuración, si no existe creamos una por defecto
    let config = await prisma.configuracion.findFirst();
    if (!config) {
      config = await prisma.configuracion.create({
        data: {
          nombreBanco: "Banco Default",
          titular: "Tu Empresa S.A.",
          cbu: "00000000",
          alias: "ALIAS.DEFAULT"
        }
      });
    }
    return config;
  }

  async updateConfig(data: { nombreBanco: string; titular: string; cbu: string; alias: string }) {
    const config = await this.getConfig(); // Asegura que existe ID
    return await prisma.configuracion.update({
      where: { id: config.id },
      data
    });
  }
}