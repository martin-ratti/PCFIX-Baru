/**
 * Centralized Product Types
 * This file contains all product-related interfaces used across the application.
 * Import from here instead of defining locally to maintain consistency.
 */

/**
 * Raw product data as returned from the API/Database
 */
export interface ProductDB {
    id: number;
    nombre: string;
    descripcion: string;
    precio: string | number;
    precioOriginal: string | number | null;
    stock: number;
    foto: string | null;
    categoriaId: number;
    marcaId?: number | null;
    categoria?: { id?: number; nombre: string };
    marca?: { id?: number; nombre: string } | null;
    peso?: number;
    alto?: number;
    ancho?: number;
    profundidad?: number;
    isFeatured?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Transformed product for UI components (ProductCard, Carousel, etc.)
 */
export interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    imageUrl: string;
    imageAlt: string;
    stock: number;
    slug: string;
    description?: string;
    categoria?: { nombre: string };
}

/**
 * Product for Carousel components (extends ProductCardProps)
 */
export interface CarouselProduct extends ProductCardProps { }

/**
 * Helper function to transform ProductDB to ProductCardProps
 */
export function mapProductDBToCardProps(p: ProductDB): ProductCardProps {
    return {
        id: p.id.toString(),
        name: p.nombre,
        price: Number(p.precio),
        originalPrice: p.precioOriginal ? Number(p.precioOriginal) : null,
        imageUrl: p.foto || 'https://placehold.co/600x600/png?text=Sin+Imagen',
        imageAlt: p.nombre,
        stock: p.stock,
        slug: p.id.toString(),
        description: p.descripcion,
        categoria: p.categoria,
    };
}

/**
 * Pagination metadata from API
 */
export interface PaginationMeta {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
}

/**
 * Category interface
 */
export interface Category {
    id: number;
    nombre: string;
    padreId?: number | null;
    subcategorias?: Category[];
}

/**
 * Brand interface
 */
export interface Brand {
    id: number;
    nombre: string;
    logo: string | null;
}
