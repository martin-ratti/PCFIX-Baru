/**
 * Centralized Sale Types
 */

import type { User } from './user';
import type { ProductCardProps } from './product';

/**
 * Sale status enum
 */
export type SaleStatus = 'PENDIENTE' | 'APROBADO' | 'CANCELADO' | 'ENVIADO' | 'ENTREGADO';

/**
 * Delivery type
 */
export type DeliveryType = 'ENVIO' | 'RETIRO';

/**
 * Payment method
 */
export type PaymentMethod = 'TRANSFERENCIA' | 'MERCADOPAGO' | 'EFECTIVO' | 'BINANCE';

/**
 * Sale line item
 */
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

/**
 * Full sale data from API
 */
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

/**
 * Create sale request payload
 */
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

/**
 * Cart item (for shopping cart)
 */
export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    imageAlt: string;
    stock: number;
}
