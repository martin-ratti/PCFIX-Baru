import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import ProductCard from '../products/ProductCard';

interface ProductCardProps {
    id: string; name: string; price: number; imageUrl: string; imageAlt: string; originalPrice?: number | null; stock: number; slug: string; description: string;
}

export default function FavoritesPageContent() {
    const { user, isAuthenticated } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [favorites, setFavorites] = useState<ProductCardProps[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Esperamos a que Zustand hidrate el usuario
        const timer = setTimeout(() => {
            if (isAuthenticated && user?.id) {
                fetchFavorites(user.id);
            } else {
                setIsLoading(false);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [isAuthenticated, user?.id]);

    const fetchFavorites = async (userId: number) => {
        try {
            const res = await fetch(`http://localhost:3002/api/favorites/${userId}`);
            const result = await res.json();
            
            if (result.success) {
                const mappedProducts = result.data.map((p: any) => ({
                    id: String(p.id),
                    name: p.nombre,
                    price: Number(p.precio),
                    imageUrl: p.foto || '',
                    imageAlt: p.nombre,
                    description: p.descripcion,
                    stock: p.stock,
                    slug: String(p.id),
                    originalPrice: p.precioOriginal ? Number(p.precioOriginal) : null,
                }));
                setFavorites(mappedProducts);
            } else {
                addToast('Error al cargar favoritos', 'error');
            }
        } catch (e) {
            addToast('Error de conexión con la API', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return <div className="p-12 text-center text-gray-500">Cargando tu lista de deseos...</div>;
    }
    
    if (!isAuthenticated || !user) {
        return (
            <div className="bg-gray-50 p-12 rounded-lg text-center border border-gray-200">
                <p className="text-xl font-medium text-secondary mb-4">Necesitas iniciar sesión para ver tus favoritos.</p>
                <a href="/login" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90">Iniciar Sesión</a>
            </div>
        );
    }
    
    if (favorites && favorites.length === 0) {
        return (
            <div className="bg-gray-50 p-12 rounded-lg text-center border border-gray-200">
                <p className="text-xl font-medium text-secondary mb-4">Aún no tienes productos en tu lista.</p>
                <a href="/productos" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90">Explorar Catálogo</a>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {favorites?.map((product) => (
                // CORRECCIÓN: Eliminado 'client:visible'
                <ProductCard key={product.id} product={product} /> 
            ))}
        </div>
    );
}