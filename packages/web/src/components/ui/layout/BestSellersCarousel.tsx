import React, { useState, useEffect } from 'react';
import { FlameIcon } from '../../SharedIcons'; // 👇 Import
import Carousel, { type CarouselProduct } from './Carousel';
import ProductCardSkeleton from '../feedback/ProductCardSkeleton';

import { API_URL } from '../../../utils/api';
// API_URL is imported

export default function BestSellersCarousel() {
    const [products, setProducts] = useState<CarouselProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBestSellers = async () => {
            try {
                const response = await fetch(`${API_URL}/products/best-sellers?limit=10`);
                const data = await response.json();

                if (data.success && data.data) {
                    const mapped: CarouselProduct[] = data.data.map((p: any) => ({
                        id: String(p.id),
                        name: p.nombre,
                        price: Number(p.precio),
                        originalPrice: p.precioOriginal ? Number(p.precioOriginal) : null,
                        imageUrl: p.foto || '/placeholder-product.png',
                        imageAlt: p.nombre,
                        stock: p.stock,
                        slug: String(p.id),
                        description: p.descripcion
                    }));
                    setProducts(mapped);
                }
            } catch (error) {
                console.error('Error fetching best sellers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBestSellers();
    }, []);

    if (loading) {
        return (
            <section className="mb-16 relative">
                <h2 className="text-3xl font-bold text-center mb-10 text-secondary flex items-center justify-center gap-2">
                    <FlameIcon className="w-8 h-8 text-orange-500" /> Lo Más Buscado
                </h2>
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} className="h-96">
                                <ProductCardSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null; // Don't show if no products
    }

    return (
        <Carousel products={products}>
            <h2 className="text-3xl font-bold text-center mb-10 text-secondary flex items-center justify-center gap-2">
                <FlameIcon className="w-8 h-8 text-orange-500" /> Lo Más Buscado
            </h2>
        </Carousel>
    );
}
