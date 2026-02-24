import { useState, useEffect } from 'react';

import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { navigate } from 'astro:transitions/client';
import StockAlertModal from './StockAlertModal';
import { API_URL } from '../../../utils/api';

interface AddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    imageUrl: string;
    imageAlt: string;
    stock: number;
    slug: string;
    description: string;
    category?: string;
  };
  stock: number;
}

export default function AddToCart({ product, stock }: AddToCartProps) {
  
  const { addItem, increaseQuantity: increaseCartItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const addToast = useToastStore((state) => state.addToast);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const isFavorited = isClient ? isFavorite(Number(product.id)) : false;

  useEffect(() => {
    setIsClient(true);
  }, []);

  
  const handleIncrease = () => {
    if (quantity < stock) setQuantity(q => q + 1);
    else addToast('Stock máximo alcanzado', 'error');
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const handleAddToCart = async () => {
    if (stock === 0) return;
    setIsAdding(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    
    
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice === null ? undefined : product.originalPrice, 
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      stock: product.stock,
      slug: product.slug,
      description: product.description
    };

    
    addItem(productToAdd);

    
    if (quantity > 1) {
      for (let i = 0; i < quantity - 1; i++) {
        increaseCartItem(product.id);
      }
    }

    addToast(`¡${quantity}x ${product.name} agregado!`, 'success');
    setIsAdding(false);
    navigate('/tienda/carrito');
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user?.id) {
      addToast("Inicia sesión para guardar favoritos", 'info');
      return;
    }

    if (isFavorited) removeFavorite(Number(product.id));
    else addFavorite(Number(product.id));

    setIsTogglingFav(true);
    try {
      const res = await fetch(`${API_URL}/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: Number(product.id) })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      addToast(json.data.message, 'success');
    } catch (e) {
      if (isFavorited) addFavorite(Number(product.id));
      else removeFavorite(Number(product.id));
      addToast('Error al guardar favorito', 'error');
    } finally {
      setIsTogglingFav(false);
    }
  };

  if (stock === 0) {
    return (
      <div className="w-full p-4 bg-gray-100 rounded-xl text-center border border-gray-200 flex flex-col gap-3">
        <div>
          <p className="text-gray-500 font-bold text-lg">Producto Agotado</p>
          <p className="text-sm text-gray-400">Te avisaremos cuando vuelva a ingresar.</p>
        </div>
        <button
          onClick={() => setIsAlertModalOpen(true)}
          className="w-full font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm border border-primary text-primary hover:bg-primary hover:text-white flex items-center justify-center gap-2 group/btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Avísame
        </button>

        <StockAlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          productId={Number(product.id)}
          productName={product.name}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-4 w-full">

          <div className="flex gap-3 w-full sm:w-auto">
            
            <div className="flex items-center border-2 border-gray-200 rounded-xl h-14 sm:h-12 bg-white shadow-sm flex-1 sm:flex-initial sm:min-w-[120px]">
              <button
                onClick={handleDecrease}
                className="w-12 md:w-16 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-50 rounded-l-xl transition-colors font-bold text-2xl sm:text-lg focus-ring"
                disabled={quantity <= 1}
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="flex-1 w-12 text-center font-black text-xl sm:text-lg text-secondary select-none">{quantity}</span>
              <button
                onClick={handleIncrease}
                className="w-12 md:w-16 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-50 rounded-r-xl transition-colors font-bold text-2xl sm:text-lg focus-ring"
                disabled={quantity >= stock}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            
            <div className="sm:hidden">
              <button
                onClick={handleToggleFavorite}
                disabled={isTogglingFav}
                className={`h-14 w-14 flex items-center justify-center rounded-xl border-2 transition-all focus-ring ${isFavorited
                  ? 'border-red-100 bg-red-50 text-red-500'
                  : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'
                  }`}
                aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
                aria-pressed={isFavorited}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isFavorited ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`w-7 h-7 transition-transform active:scale-90 ${isFavorited ? 'animate-pop' : ''}`}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
          </div>

          
          {product.category === 'Servicios' ? (
            <a
              href="/tienda/servicios"
              className="flex-1 h-14 sm:h-12 bg-black text-white font-bold text-lg sm:text-base rounded-xl shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto text-decoration-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Solicitar Servicio</span>
            </a>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 h-14 sm:h-12 bg-primary text-white font-bold text-lg sm:text-base rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:bg-opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {isAdding ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-5 sm:h-5">
                    <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z" clipRule="evenodd" />
                  </svg>
                  <span>Agregar al Carrito</span>
                </>
              )}
            </button>
          )}

          
          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFav}
            className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all focus-ring ${isFavorited
              ? 'border-red-100 bg-red-50 text-red-500'
              : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'
              }`}
            aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
            aria-pressed={isFavorited}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFavorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              className={`w-6 h-6 transition-transform active:scale-90 ${isFavorited ? 'animate-pop' : ''}`}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

        </div>
      </div>
    </div>
  );
}