/**
 * Centralized Type Definitions
 * 
 * Import types from here for convenience:
 * import type { User, ProductCardProps, Sale } from '../types';
 * 
 * Or import from specific files:
 * import type { User } from '../types/user';
 */

// Product types
export type {
    ProductDB,
    ProductCardProps,
    CarouselProduct,
    PaginationMeta,
    Category,
    Brand,
} from './product';

export { mapProductDBToCardProps } from './product';

// User types
export type {
    User,
    AuthState,
    LoginResponse,
} from './user';

// Config types
export type {
    ConfigData,
    Banner,
    ServiceItem,
} from './config';

// Sale types
export type {
    SaleStatus,
    DeliveryType,
    PaymentMethod,
    SaleLine,
    Sale,
    CreateSalePayload,
    CartItem,
} from './sale';

/**
 * Common API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
    };
}
