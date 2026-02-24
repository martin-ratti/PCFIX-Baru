


export type {
    ProductDB,
    ProductCardProps,
    CarouselProduct,
    PaginationMeta,
    Category,
    Brand,
} from './product';

export { mapProductDBToCardProps } from './product';


export type {
    User,
    AuthState,
    LoginResponse,
} from './user';


export type {
    ConfigData,
    Banner,
    ServiceItem,
} from './config';


export type {
    SaleStatus,
    DeliveryType,
    PaymentMethod,
    SaleLine,
    Sale,
    CreateSalePayload,
    CartItem,
} from './sale';


export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}


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
