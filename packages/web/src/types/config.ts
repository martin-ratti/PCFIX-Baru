

import type { Brand } from './product';


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


export interface Banner {
    id: number;
    imagen: string;
    marca: Brand;
}


export interface ServiceItem {
    id: number;
    title: string;
    price: number;
    description: string;
    active?: boolean;
}
