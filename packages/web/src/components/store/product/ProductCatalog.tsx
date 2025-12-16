import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from '../../ui/feedback/ProductCardSkeleton';
import EmptyState from '../../ui/feedback/EmptyState';
import type { ProductCardProps, ProductDB, PaginationMeta } from '../../../types/product';
import { mapProductDBToCardProps } from '../../../types/product';

import { API_URL } from '../../../utils/api';

interface Props {
    initialProducts: ProductCardProps[];
    initialMeta: PaginationMeta;
    search?: string;
    categoryId?: string;
    marcaId?: string;
    sort?: string;
}

export default function ProductCatalog({
    initialProducts,
    initialMeta,
    search,
    categoryId,
    marcaId,
    sort
}: Props) {
    const [products, setProducts] = useState<ProductCardProps[]>(initialProducts);
    const [meta, setMeta] = useState(initialMeta);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(initialMeta.page);

    const hasMore = currentPage < meta.lastPage;

    const loadMore = async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        const nextPage = currentPage + 1;

        try {
            const apiUrl = new URL(`${API_URL}/products`);
            apiUrl.searchParams.append('page', nextPage.toString());
            apiUrl.searchParams.append('limit', meta.limit.toString());
            if (search) apiUrl.searchParams.append('search', search);
            if (categoryId) apiUrl.searchParams.append('categoryId', categoryId);
            if (marcaId) apiUrl.searchParams.append('marcaId', marcaId);
            if (sort) apiUrl.searchParams.append('order', sort);

            const response = await fetch(apiUrl.toString());
            const result = await response.json();

            if (result.success) {
                const newProducts: ProductCardProps[] = result.data.map((p: ProductDB) => mapProductDBToCardProps(p));

                setProducts(prev => [...prev, ...newProducts]);
                setMeta(result.meta);
                setCurrentPage(nextPage);
            }
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (products.length === 0 && !isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <EmptyState
                    title="No encontramos productos"
                    description="Intenta ajustar tus filtros o busca con términos más generales."
                    icon={<span className="text-4xl">🔍</span>}
                    action={{
                        label: "Ver todo el catálogo",
                        href: "/tienda/productos"
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 animate-fade-in">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}

                {/* Skeletons while loading */}
                {isLoading && Array(4).fill(0).map((_, i) => (
                    <ProductCardSkeleton key={`skeleton-${i}`} />
                ))}
            </div>

            {/* Load More Button */}
            {hasMore && !isLoading && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={loadMore}
                        className="group bg-white border-2 border-primary text-primary font-bold py-3 px-8 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2 shadow-sm"
                    >
                        <span>Ver más productos</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 group-hover:translate-y-0.5 transition-transform"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div className="flex justify-center pt-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-sm font-medium">Cargando más productos...</span>
                    </div>
                </div>
            )}

            {/* Pagination info */}
            <div className="text-center text-sm text-gray-400">
                Mostrando {products.length} de {meta.total} productos
            </div>
        </div>
    );
}
