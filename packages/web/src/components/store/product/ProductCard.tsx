import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { useToastStore } from '../../../stores/toastStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../../ui/feedback/ConfirmModal';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null; 
    imageUrl: string;
    imageAlt: string;
    stock: number;
    slug: string;
    description?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, increaseQuantity, decreaseQuantity } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  // Estado para renderizado en cliente (evita error de hidratación)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Derivados seguros
  const isAdmin = isClient && user?.role === 'ADMIN';
  const isFavorited = isClient ? isFavorite(Number(product.id)) : false;
  const itemInCart = isClient ? items.find((item) => item.id === product.id) : null;

  const discountPercent = (product.originalPrice && product.originalPrice > product.price)
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // --- HANDLERS ---
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    
    if (!isAuthenticated || !user?.id) {
        addToast("Inicia sesión para guardar tus favoritos", 'info');
        return;
    }
    
    if (isFavorited) removeFavorite(Number(product.id));
    else addFavorite(Number(product.id));
    
    setIsTogglingFavorite(true);

    try {
        const payload = { userId: user.id, productId: Number(product.id) };
        const res = await fetch(`http://localhost:3002/api/favorites/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
    } catch (e) {
        if (isFavorited) addFavorite(Number(product.id));
        else removeFavorite(Number(product.id));
        addToast("Error al sincronizar favorito", 'error');
    } finally {
        setIsTogglingFavorite(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock > 0) {
      addItem({ ...product, description: product.description || '', slug: product.slug || product.id, originalPrice: product.originalPrice || undefined });
      addToast('Agregado al carrito', 'success');
    }
  };

  const handleEdit = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); navigate(`/admin/editar/${product.id}`); };
  const handleDeleteClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsDeleteModalOpen(true); };
  
  const confirmDelete = async () => { 
    try { 
        const res = await fetch(`http://localhost:3002/api/products/${product.id}`, { method: 'DELETE' }); 
        const data = await res.json();
        if (data.success) { addToast('Eliminado', 'success'); window.location.reload(); }
    } catch { addToast('Error', 'error'); } finally { setIsDeleteModalOpen(false); }
  };

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative group h-full flex flex-col">
        
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {discountPercent}% OFF
            </span>
            )}
        </div>

        {isClient && isAdmin && (
          <div className="absolute top-3 right-3 bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded-md z-10 backdrop-blur-sm pointer-events-none font-mono">
            ID: {product.id}
          </div>
        )}
        
        {/* Botón Favorito (Renderizado seguro solo en cliente) */}
        {isClient && !isAdmin && (
            <button 
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className={`absolute top-3 right-3 p-2 rounded-full z-20 transition-all duration-200 shadow-sm 
                    ${isFavorited ? 'text-red-500 bg-white scale-110' : 'text-gray-400 bg-white/90 hover:text-red-500 hover:bg-white'}`}
                title="Favorito"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </button>
        )}

        <a href={`/producto/${product.id}`} className="block overflow-hidden relative pt-[100%] bg-white">
          <img className="absolute top-0 left-0 w-full h-full object-contain p-6 transform group-hover:scale-105 transition-transform duration-500 ease-out" src={product.imageUrl} alt={product.imageAlt} loading="lazy" />
          {product.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]"><span className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">SIN STOCK</span></div>}
        </a>

        <div className="p-5 flex flex-col flex-grow border-t border-gray-50 bg-white">
          <h3 className="text-base font-bold text-secondary mb-2 leading-snug hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]"><a href={`/producto/${product.id}`}>{product.name}</a></h3>
          
          <div className="mt-auto pt-2">
            <div className="mb-4 min-h-[3rem] flex flex-col justify-end">
              {discountPercent > 0 && product.originalPrice ? (
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-400 line-through font-medium">${Number(product.originalPrice).toLocaleString('es-AR')}</span>
                  <span className="text-xl font-black text-red-600">${product.price.toLocaleString('es-AR')}</span>
                </div>
              ) : (<p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>)}
            </div>

            {isClient && (
                isAdmin ? (
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleEdit} className="bg-blue-50 text-blue-700 font-bold py-2 rounded-lg text-sm hover:bg-blue-100">Editar</button>
                    <button onClick={handleDeleteClick} className="bg-red-50 text-red-700 font-bold py-2 rounded-lg text-sm hover:bg-red-100">Eliminar</button>
                </div>
                ) : (
                !itemInCart ? (
                    <button onClick={handleAddToCart} disabled={product.stock === 0} className={`w-full font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ${product.stock > 0 ? 'bg-primary text-white hover:bg-opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      {product.stock > 0 ? <span>Agregar</span> : 'Sin Stock'}
                    </button>
                ) : (
                    <div className="flex items-center justify-between border border-primary/20 rounded-lg bg-primary/5 p-1">
                    <button onClick={(e) => { e.preventDefault(); decreaseQuantity(product.id); }} className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-primary font-bold shadow-sm">-</button>
                    <span className="text-sm font-bold text-primary px-2">{itemInCart.quantity}</span>
                    <button onClick={(e) => { e.preventDefault(); increaseQuantity(product.id); }} className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-primary font-bold shadow-sm">+</button>
                    </div>
                )
                )
            )}
          </div>
        </div>
      </div>
      <ConfirmModal isOpen={isDeleteModalOpen} title="Eliminar" message="¿Borrar?" confirmText="Sí" isDanger={true} onConfirm={confirmDelete} onCancel={() => setIsDeleteModalOpen(false)} />
    </>
  );
}