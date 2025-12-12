import React, { useState, useEffect } from 'react';
import Carousel, { type CarouselProduct } from './Carousel';

const API_URL = 'https://pcfix-baru-production.up.railway.app/api';

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
                <h2 className="text-3xl font-bold text-center mb-10 text-secondary">Lo Más Buscado 🔥</h2>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null; // Don't show if no products
    }

    return <Carousel title="Lo Más Buscado 🔥" products={products} />;
}
