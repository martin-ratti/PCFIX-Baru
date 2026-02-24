

import type { User } from './user';
import type {} from './product';


export type SaleStatus = 'PENDIENTE' | 'APROBADO' | 'CANCELADO' | 'ENVIADO' | 'ENTREGADO';


export type DeliveryType = 'ENVIO' | 'RETIRO';


export type PaymentMethod = 'TRANSFERENCIA' | 'MERCADOPAGO' | 'EFECTIVO' | 'BINANCE';


export interface SaleLine {
    id: number;
    productoId: number;
    cantidad: number;
    subTotal: number;
    producto: {
        id: number;
        nombre: string;
        foto: string | null;
        precio: number;
    };
}


export interface Sale {
    id: number;
    fecha: string;
    estado: SaleStatus;
    medioPago: PaymentMethod;
    montoTotal: number;
    cpDestino?: string | null;
    costoEnvio?: number;
    tipoEntrega: DeliveryType;
    direccionEnvio?: string | null;
    ciudadEnvio?: string | null;
    provinciaEnvio?: string | null;
    telefonoEnvio?: string | null;
    documentoEnvio?: string | null;
    usuarioId: number;
    usuario?: User;
    lineasVenta: SaleLine[];
    trackingCode?: string | null;
    createdAt?: string;
    updatedAt?: string;
}


export interface CreateSalePayload {
    items: { id: number | string; quantity: number }[];
    subtotal: number;
    cpDestino?: string;
    tipoEntrega: DeliveryType;
    medioPago: PaymentMethod;
    direccionEnvio?: string;
    ciudadEnvio?: string;
    provinciaEnvio?: string;
    telefonoEnvio?: string;
    documentoEnvio?: string;
}


export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    imageAlt: string;
    stock: number;
}
