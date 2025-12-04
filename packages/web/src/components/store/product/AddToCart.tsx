import React, { useState, useEffect } from 'react';
// Asegúrate de que estas rutas sean correctas según tu estructura actual
import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { navigate } from 'astro:transitions/client';

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
  };
  stock: number;
}

export default function AddToCart({ product, stock }: AddToCartProps) {
  // Solo necesitamos addItem del store, no increaseQuantity
  const { addItem, items, increaseQuantity: increaseCartItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const addToast = useToastStore((state) => state.addToast);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const isFavorited = isClient ? isFavorite(Number(product.id)) : false;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handlers para el contador LOCAL
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
    
    // 1. Agregamos el producto base al carrito
    // Convertimos originalPrice null -> undefined para satisfacer TS
    const productToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice === null ? undefined : product.originalPrice, // FIX
        imageUrl: product.imageUrl,
        imageAlt: product.imageAlt,
        stock: product.stock,
        slug: product.slug,
        description: product.description
    };

    // Agregamos el primer ítem
    addItem(productToAdd);

    // 2. Si la cantidad local es > 1, incrementamos en el store
    if (quantity > 1) {
        for (let i = 0; i < quantity - 1; i++) {
            increaseCartItem(product.id);
        }
    }
    
    addToast(`¡${quantity}x ${product.name} agregado!`, 'success');
    setIsAdding(false);
    navigate('/carrito');
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
        const res = await fetch('http://localhost:3002/api/favorites/toggle', {
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
      <div className="w-full p-4 bg-gray-100 rounded-xl text-center border border-gray-200">
        <p className="text-gray-500 font-bold text-lg">Producto Agotado</p>
        <p className="text-sm text-gray-400">Te avisaremos cuando vuelva a ingresar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        
        {/* Selector de Cantidad */}
        <div className="flex items-center border-2 border-gray-200 rounded-xl h-12 bg-white shadow-sm w-full sm:w-auto justify-between sm:justify-start">
          <button 
            onClick={handleDecrease}
            className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-50 rounded-l-xl transition-colors font-bold text-lg"
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="w-12 text-center font-black text-lg text-secondary select-none">{quantity}</span>
          <button 
            onClick={handleIncrease}
            className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-50 rounded-r-xl transition-colors font-bold text-lg"
            disabled={quantity >= stock}
          >
            +
          </button>
        </div>

        {/* Botón Agregar */}
        <button 
          onClick={handleAddToCart}
          disabled={isAdding}
          className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:bg-opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {isAdding ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z" clipRule="evenodd" />
              </svg>
              <span>Agregar al Carrito</span>
            </>
          )}
        </button>

        {/* Botón Favorito */}
        <button 
            onClick={handleToggleFavorite}
            disabled={isTogglingFav}
            className={`h-12 w-12 flex items-center justify-center rounded-xl border-2 transition-all ${
                isFavorited 
                    ? 'border-red-100 bg-red-50 text-red-500' 
                    : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'
            }`}
            title={isFavorited ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-6 h-6 transition-transform active:scale-90">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
        </button>

      </div>
    </div>
  );
}