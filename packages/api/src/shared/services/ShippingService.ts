import axios from 'axios';
import { prisma } from '../../shared/database/prismaClient';

export interface ShippingItem {
  weight: number;
  height: number;
  width: number;
  depth: number;
  quantity: number;
  description?: string;
  sku?: string;
}

export interface ShippingDestination {
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  telefono?: string;
  nombre?: string;
  email?: string;
  documento?: string; // DNI del destinatario
  piso?: string; // Piso/Departamento
}

export interface ShipmentResult {
  shipmentId: string;
  trackingCode: string;
  labelUrl: string;
  carrier: string;
  estimatedDelivery?: string;
}

// Lista de provincias argentinas para validación/mapping
export const PROVINCIAS_ARGENTINAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
  'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
  'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
];

export class ShippingService {
  private baseUrl: string;
  private apiToken: string;
  private apiSecret: string;
  private accountId: string;
  private basicAuthHeader: string;
  private isSandbox: boolean;

  private originId: number | null = null;

  constructor() {
    this.apiToken = (process.env.ZIPPIN_CLIENT_ID || '').trim();
    this.apiSecret = (process.env.ZIPPIN_CLIENT_SECRET || '').trim();
    this.accountId = (process.env.ZIPPIN_ACCOUNT_ID || '').trim();
    this.isSandbox = process.env.ZIPPIN_SANDBOX === 'true';

    // Usar sandbox o producción según configuración
    this.baseUrl = this.isSandbox
      ? 'https://api-sandbox.zipnova.com.ar/v2'
      : 'https://api.zipnova.com.ar/v2';

    // Construir header de autenticación básica HTTP
    const credentials = Buffer.from(`${this.apiToken}:${this.apiSecret}`).toString('base64');
    this.basicAuthHeader = `Basic ${credentials}`;

    if (process.env.ZIPPIN_SUCURSAL_ID) {
      this.originId = Number(process.env.ZIPPIN_SUCURSAL_ID);
    }
  }

  private getHeaders() {
    return {
      'Authorization': this.basicAuthHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  private getOriginId(): number {
    if (!this.originId) {
      throw new Error('ZIPPIN_SUCURSAL_ID no configurado');
    }
    return this.originId;
  }

  // ========== COTIZACIÓN ==========
  async calculateCost(zipCodeDestino: string, items: ShippingItem[]): Promise<number> {
    if (!this.apiToken) return 6500;

    try {
      const origin = this.getOriginId();

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
        account_id: this.accountId,
        origin_id: origin,
        declared_value: 10000,
        items: [{
          weight: Math.max(totalWeight * 1000, 100),
          height: Math.max(side, 1),
          width: Math.max(side, 1),
          length: Math.max(side, 1),
          description: 'Productos PCFIX',
          classification_id: 1
        }],
        destination: {
          zipcode: zipCodeDestino,
          city: 'N/A',
          state: 'N/A'
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/shipments/quote`,
        payload,
        { headers: this.getHeaders() }
      );

      // Zipnova retorna { all_results: [...] } donde cada item tiene amounts.price_incl_tax
      const allResults = response.data?.all_results;

      if (!allResults || !Array.isArray(allResults) || allResults.length === 0) {
        console.error('Zipnova no devolvió servicios:', response.data);
        throw new Error("Sin resultados de cotización");
      }

      // Buscar el precio más barato (con impuestos incluidos)
      // Filtrar solo opciones seleccionables
      const selectableOptions = allResults.filter((opt: any) => opt.selectable);

      if (selectableOptions.length === 0) {
        throw new Error("No hay opciones de envío disponibles para este destino");
      }

      // FILTRAR SOLO CORREO ARGENTINO
      const correoArgentinoOptions = selectableOptions.filter((opt: any) =>
        opt.carrier?.name?.toLowerCase().includes('correo argentino')
      );

      // Si hay opciones de Correo Argentino, usar la más barata de esas
      const optionsToUse = correoArgentinoOptions.length > 0
        ? correoArgentinoOptions
        : selectableOptions;

      // Encontrar el más barato
      const cheapest = optionsToUse.reduce((prev: any, curr: any) => {
        const prevPrice = prev.amounts?.price_incl_tax || prev.amounts?.price || Infinity;
        const currPrice = curr.amounts?.price_incl_tax || curr.amounts?.price || Infinity;
        return prevPrice < currPrice ? prev : curr;
      });

      const finalPrice = cheapest.amounts?.price_incl_tax || cheapest.amounts?.price;

      console.log(`📦 Cotización: ${cheapest.carrier?.name} - ${cheapest.service_type?.name} - $${finalPrice}`);

      return Math.round(Number(finalPrice));

    } catch (error: any) {
      console.error("Error cotización Zipnova:", error.response?.data || error.message);
      const config = await prisma.configuracion.findFirst();
      return config ? Number(config.costoEnvioFijo) : 7000;
    }
  }

  // ========== CREAR ENVÍO ==========
  async createShipment(
    items: ShippingItem[],
    destination: ShippingDestination,
    declaredValue: number,
    externalId?: string
  ): Promise<ShipmentResult> {

    if (!this.apiToken) {
      throw new Error('Credenciales Zipnova no configuradas');
    }

    const origin = this.getOriginId();

    // Calcular dimensiones del paquete
    let totalWeight = 0;
    let totalVol = 0;
    const itemsForShipment: any[] = [];

    items.forEach((item, idx) => {
      const peso = Number(item.weight) || 0.1;
      totalWeight += peso * item.quantity;
      const vol = (item.height || 10) * (item.width || 10) * (item.depth || 10);
      totalVol += vol * item.quantity;

      itemsForShipment.push({
        sku: item.sku || `ITEM-${idx + 1}`,
        weight: Math.max(peso * 1000, 100), // gramos
        height: item.height || 10,
        width: item.width || 10,
        length: item.depth || 10,
        description: item.description || 'Producto PCFIX',
        classification_id: 1
      });
    });

    const payload = {
      account_id: this.accountId,
      origin_id: origin,
      external_id: externalId || `PCFIX-${Date.now()}`,
      declared_value: Math.round(declaredValue), // pesos (no centavos)
      type_id: 1, // Standard delivery
      service_type: 'standard_delivery', // REQUERIDO: tipo de servicio
      items: itemsForShipment,
      destination: {
        name: destination.nombre || 'Cliente',
        document: destination.documento || '00000000', // DNI requerido
        street: destination.direccion?.replace(/\d+$/, '').trim() || 'Sin calle', // calle sin número
        street_number: destination.direccion?.match(/\d+$/)?.[0] || 'S/N', // número de calle
        street_extras: destination.piso || '', // piso/depto
        city: destination.ciudad || 'Ciudad',
        state: destination.provincia || 'Provincia',
        zipcode: destination.codigoPostal || '1000',
        phone: destination.telefono || '',
        email: destination.email || ''
      }
    };

    try {
      console.log('📦 Creando envío en Zipnova...', this.isSandbox ? '[SANDBOX]' : '[PRODUCCIÓN]');

      const response = await axios.post(
        `${this.baseUrl}/shipments`,
        payload,
        { headers: this.getHeaders() }
      );

      const shipmentData = response.data.data || response.data;

      return {
        shipmentId: String(shipmentData.id),
        trackingCode: shipmentData.tracking_id || shipmentData.tracking_code || '',
        labelUrl: shipmentData.label_url || '',
        carrier: shipmentData.logistic_type || shipmentData.carrier || 'Zipnova',
        estimatedDelivery: shipmentData.estimated_delivery_date
      };

    } catch (error: any) {
      console.error('❌ Error creando envío:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.errors?.[Object.keys(error.response?.data?.errors || {})[0]]?.[0] ||
        'Error al crear envío en Zipnova'
      );
    }
  }

  // ========== OBTENER ETIQUETA ==========
  async getLabel(shipmentId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/shipments/${shipmentId}/label`,
        { headers: this.getHeaders() }
      );

      return response.data.data?.url || response.data.url || '';
    } catch (error: any) {
      console.error('Error obteniendo etiqueta:', error.response?.data || error.message);
      throw new Error('No se pudo obtener la etiqueta de envío');
    }
  }

  // ========== CONSULTAR ESTADO ==========
  async getTrackingInfo(shipmentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/shipments/${shipmentId}`,
        { headers: this.getHeaders() }
      );

      const data = response.data.data || response.data;
      return {
        status: data.status,
        statusDescription: data.status_description,
        trackingCode: data.tracking_id,
        carrier: data.logistic_type,
        estimatedDelivery: data.estimated_delivery_date,
        events: data.tracking_events || []
      };
    } catch (error: any) {
      console.error('Error consultando envío:', error.response?.data || error.message);
      throw new Error('No se pudo consultar el estado del envío');
    }
  }

  // ========== CANCELAR ENVÍO ==========
  async cancelShipment(shipmentId: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/shipments/${shipmentId}`,
        { headers: this.getHeaders() }
      );
      return true;
    } catch (error: any) {
      console.error('Error cancelando envío:', error.response?.data || error.message);
      return false;
    }
  }

  // ========== HELPERS ==========
  isSandboxMode(): boolean {
    return this.isSandbox;
  }

  isConfigured(): boolean {
    return !!this.apiToken && !!this.accountId && !!this.originId;
  }
}