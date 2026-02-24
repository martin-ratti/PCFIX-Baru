


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


export interface CarouselProduct extends ProductCardProps { }


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


export interface PaginationMeta {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
}


export interface Category {
    id: number;
    nombre: string;
    padreId?: number | null;
    subcategorias?: Category[];
}


export interface Brand {
    id: number;
    nombre: string;
    logo: string | null;
}
