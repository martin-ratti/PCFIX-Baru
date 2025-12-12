/**
 * Centralized Config Types
 */

import type { Brand } from './product';

/**
 * Store configuration data
 */
export interface ConfigData {
    nombreBanco: string;
    titular: string;
    cbu: string;
    alias: string;
    binanceAlias?: string;
    binanceCbu?: string;
    direccionLocal?: string;
    horariosLocal?: string;
    cotizacionUsdt?: number;
    costoEnvioFijo?: number;
    maintenanceMode?: boolean;
}

/**
 * Banner data
 */
export interface Banner {
    id: number;
    imagen: string;
    marca: Brand;
}

/**
 * Service item for technical services
 */
export interface ServiceItem {
    id: number;
    title: string;
    price: number;
    description: string;
    active?: boolean;
}
