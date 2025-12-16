import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { API_URL } from '../../../utils/api';
import { useToastStore } from '../../../stores/toastStore';
import ProductCard from '../../store/product/ProductCard';
import type { ProductCardProps, ProductDB } from '../../../types/product';
import { mapProductDBToCardProps } from '../../../types/product';

export default function FavoritesPageContent() {
    const { user, isAuthenticated } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [favorites, setFavorites] = useState<ProductCardProps[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
            const res = await fetch(`${API_URL}/favorites/${userId}`);
            const result = await res.json();

            if (result.success) {
                const mappedProducts = result.data.map((p: ProductDB) => mapProductDBToCardProps(p));
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

    // --- LOADING STATE (Estandarizado) ---
    if (isLoading) {
        return (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    // --- NO AUTENTICADO (UI Mejorada) ---
    if (!isAuthenticated || !user) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Inicia sesión para ver tus favoritos</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Guarda los productos que más te gustan y consúltalos desde cualquier dispositivo.</p>
                <a href="/auth/login" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95">
                    Iniciar Sesión
                </a>
            </div>
        );
    }

    // --- LISTA VACÍA (UI Estandarizada) ---
    if (favorites && favorites.length === 0) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    {/* Icono Corazón */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">Tu lista de deseos está vacía</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                    Parece que aún no has encontrado ese componente especial. ¡Explora nuestro catálogo!
                </p>

                {/* Botón Sólido (Consistente con Ventas y Consultas) */}
                <a
                    href="/tienda/productos"
                    className="bg-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Explorar Catálogo
                </a>
            </div>
        );
    }

    // --- LISTA DE FAVORITOS ---
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
            {favorites?.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}