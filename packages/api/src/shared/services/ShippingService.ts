import axios from 'axios';
import { prisma } from '../../shared/database/prismaClient';

export interface ShippingItem {
  weight: number;
  height: number;
  width: number;
  depth: number;
  quantity: number;
}

export class ShippingService {
  private baseUrl: string;
  private authUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accountId: string;

  private accessToken: string | null = null;
  private originId: number | null = null;

  constructor() {
    this.clientId = (process.env.ZIPPIN_CLIENT_ID || '').trim();
    this.clientSecret = (process.env.ZIPPIN_CLIENT_SECRET || '').trim();
    this.accountId = (process.env.ZIPPIN_ACCOUNT_ID || '').trim();

    this.baseUrl = 'https://api.zippin.com.ar/v2';
    this.authUrl = 'https://api.zippin.com.ar';

    if (process.env.ZIPPIN_SUCURSAL_ID) {
      this.originId = Number(process.env.ZIPPIN_SUCURSAL_ID);
    }
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const endpoint = `${this.authUrl}/oauth/token`;

    const payload = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      return this.accessToken!;

    } catch (error: any) {
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data Respuesta:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(`Error de Red/Código: ${error.message}`);
      }
      throw new Error('Fallo autenticación logística');
    }
  }

  private async getOriginBranchId(token: string): Promise<number> {
    if (this.originId) return this.originId;
    try {
      const response = await axios.get(`${this.baseUrl}/shipments/organizations/${this.accountId}/zones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const zones = response.data.results || response.data;
      if (zones && zones.length > 0) {
        this.originId = zones[0].id;
        return this.originId!;
      }
      throw new Error("No se encontraron sucursales");
    } catch (error) { throw new Error("Error obteniendo sucursal"); }
  }

  async calculateCost(zipCodeDestino: string, items: ShippingItem[]): Promise<number> {
    if (!this.clientId) return 6500;

    try {
      const token = await this.authenticate();
      const origin = await this.getOriginBranchId(token);

      let totalWeight = 0;
      let totalVol = 0;
      items.forEach(i => {
        const peso = Number(i.weight) || 0.1;
        totalWeight += (peso * i.quantity);
        const vol = (i.height || 10) * (i.width || 10) * (i.depth || 10);
        totalVol += vol * i.quantity;
      });
      const side = Math.round(Math.pow(totalVol, 1 / 3)) || 20;

      const payload = {
        origin_id: origin,
        destination: { zipcode: zipCodeDestino },
        packages: [{ weight: totalWeight, height: side, width: side, depth: side }]
      };

      const response = await axios.post(`${this.baseUrl}/shipments/quote`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const services = response.data.results || [];
      if (services.length === 0) throw new Error("Sin resultados");

      const bestOption = services.reduce((prev: any, curr: any) =>
        Number(prev.amount) < Number(curr.amount) ? prev : curr
      );
      return Number(bestOption.amount);

    } catch (error: any) {
      if (!error.message.includes('autenticación')) {
        console.error("Error cotización:", error.response?.data || error.message);
      }
      const config = await prisma.configuracion.findFirst();
      return config ? Number(config.costoEnvioFijo) : 7000;
    }
  }
}