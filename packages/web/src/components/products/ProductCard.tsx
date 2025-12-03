import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useFavoritesStore } from '../../stores/favoritesStore'; // Store global de favoritos
import { useToastStore } from '../../stores/toastStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../shared/ConfirmModal';

/**
 * Interfaz que define la estructura de datos que espera el componente.
 * Debe coincidir con lo que devuelve la API y las transformaciones del frontend.
 */
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null; // Puede ser null si no hay oferta
    imageUrl: string;
    imageAlt: string;
    stock: number;
    slug: string;
    description?: string;
  };
}

/**
 * Componente de Tarjeta de Producto (Producción).
 * * Responsabilidades:
 * 1. Visualización: Muestra datos, precio, ofertas y badges.
 * 2. Interacción Cliente: Agregar al carrito, gestionar favoritos.
 * 3. Interacción Admin: Editar y eliminar productos.
 * 4. Estado Global: Se sincroniza con AuthStore, CartStore y FavoritesStore.
 */
export default function ProductCard({ product }: ProductCardProps) {
  // --- STORES GLOBALES ---
  const { items, addItem, increaseQuantity, decreaseQuantity } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const addToast = useToastStore(s => s.addToast);
  
  // --- ESTADOS LOCALES ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // --- DERIVADOS ---
  const isAdmin = user?.role === 'ADMIN';
  const itemInCart = items.find((item) => item.id === product.id);
  
  // Chequeo reactivo instantáneo contra el store en memoria
  const isFavorited = isFavorite(Number(product.id));

  // Cálculo seguro del porcentaje de descuento
  const discountPercent = (product.originalPrice && product.originalPrice > product.price)
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // --- HANDLERS (Manejadores de Eventos) ---

  /**
   * Alternar estado de favorito.
   * Usa 'Optimistic UI Update': actualiza la interfaz primero, luego sincroniza con API.
   * Si falla, revierte el cambio.
   */
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (!isAuthenticated || !user?.id) {
        addToast("Inicia sesión para guardar tus favoritos", 'info');
        return;
    }
    
    // 1. Actualización Optimista
    if (isFavorited) {
        removeFavorite(Number(product.id));
    } else {
        addFavorite(Number(product.id));
    }
    
    setIsTogglingFavorite(true);

    try {
        // 2. Sincronización con Backend
        const payload = { userId: user.id, productId: Number(product.id) };
        const res = await fetch(`http://localhost:3002/api/favorites/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (!data.success) {
            throw new Error(data.error || "Error al sincronizar");
        }
        
        // Feedback sutil solo si es necesario, o confiar en el cambio visual
        // addToast(data.data.message, 'success'); 

    } catch (e) {
        // 3. Rollback en caso de error
        console.error("Fallo al guardar favorito:", e);
        if (isFavorited) addFavorite(Number(product.id)); // Si estaba, lo devolvemos
        else removeFavorite(Number(product.id)); // Si no estaba, lo quitamos
        
        addToast("No se pudo guardar el favorito. Revisa tu conexión.", 'error');
    } finally {
        setIsTogglingFavorite(false);
    }
  };

  /**
   * Agregar producto al carrito y navegar al checkout.
   */
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (product.stock > 0) {
      addItem({ 
          ...product, 
          description: product.description || '', 
          slug: product.slug || product.id, 
          originalPrice: product.originalPrice || undefined 
      });
      addToast('Producto agregado al carrito', 'success');
      await navigate('/carrito');
    }
  };

  /**
   * Funciones de gestión de cantidad en el carrito (sin navegar)
   */
  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (itemInCart && itemInCart.quantity >= product.stock) {
      addToast(`Stock máximo alcanzado (${product.stock} u.)`, 'error');
      return;
    }
    increaseQuantity(product.id);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    decreaseQuantity(product.id);
  };

  // --- HANDLERS DE ADMIN ---

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigate(`/admin/editar/${product.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => { 
    try { 
        const res = await fetch(`http://localhost:3002/api/products/${product.id}`, { method: 'DELETE' }); 
        const data = await res.json();
        
        if (data.success) {
            addToast('Producto eliminado correctamente', 'success'); 
            window.location.reload(); 
        } else {
            addToast(data.error || 'Error al eliminar', 'error');
        }
    } catch { 
        addToast('Error de conexión', 'error'); 
    } finally { 
        setIsDeleteModalOpen(false); 
    }
  };

  // --- RENDER ---

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative group h-full flex flex-col">
        
        {/* BADGES SUPERIORES */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {discountPercent}% OFF
            </span>
            )}
        </div>

        {isAdmin && (
          <div className="absolute top-3 right-3 bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded-md z-10 backdrop-blur-sm pointer-events-none font-mono">
            ID: {product.id}
          </div>
        )}
        
        {/* BOTÓN FAVORITO (Solo para Clientes) */}
        {/* Renderizamos siempre el botón, pero si no es cliente redirige a login */}
        {!isAdmin && (
            <button 
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className={`absolute top-3 right-3 p-2 rounded-full z-20 transition-all duration-200 shadow-sm 
                    ${isFavorited 
                        ? 'text-red-500 bg-white hover:bg-red-50 scale-110' 
                        : 'text-gray-400 bg-white/90 hover:text-red-500 hover:bg-white hover:scale-110'
                    }`}
                title={isFavorited ? "Quitar de Favoritos" : "Añadir a Favoritos"}
                aria-label={isFavorited ? "Quitar de Favoritos" : "Añadir a Favoritos"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </button>
        )}

        {/* IMAGEN DEL PRODUCTO */}
        <a href={`/producto/${product.id}`} className="block overflow-hidden relative pt-[100%] bg-white">
          <img 
            className="absolute top-0 left-0 w-full h-full object-contain p-6 transform group-hover:scale-105 transition-transform duration-500 ease-out" 
            src={product.imageUrl} 
            alt={product.imageAlt}
            loading="lazy"
          />
          {/* Overlay agotado */}
          {product.stock === 0 && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">SIN STOCK</span>
              </div>
          )}
        </a>

        {/* INFORMACIÓN Y ACCIONES */}
        <div className="p-5 flex flex-col flex-grow border-t border-gray-50 bg-white">
          
          {/* Título */}
          <h3 className="text-base font-bold text-secondary mb-2 leading-snug hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
            <a href={`/producto/${product.id}`}>{product.name}</a>
          </h3>
          
          {/* Precio */}
          <div className="mt-auto pt-2">
            <div className="mb-4 min-h-[3rem] flex flex-col justify-end">
              {discountPercent > 0 && product.originalPrice ? (
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-400 line-through font-medium">
                    ${Number(product.originalPrice).toLocaleString('es-AR')}
                  </span>
                  <span className="text-xl font-black text-red-600">
                    ${product.price.toLocaleString('es-AR')}
                  </span>
                </div>
              ) : (
                <p className="text-xl font-black text-primary">
                    ${product.price.toLocaleString('es-AR')}
                </p>
              )}
            </div>

            {/* Botones de Acción */}
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleEdit} 
                    className="bg-blue-50 text-blue-700 font-bold py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                >
                    Editar
                </button>
                <button 
                    onClick={handleDeleteClick} 
                    className="bg-red-50 text-red-700 font-bold py-2 rounded-lg text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                >
                    Eliminar
                </button>
              </div>
            ) : (
              !itemInCart ? (
                <button 
                    onClick={handleAddToCart} 
                    disabled={product.stock === 0} 
                    className={`w-full font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2
                        ${product.stock > 0 
                            ? 'bg-primary text-white hover:bg-opacity-90 hover:shadow-md active:scale-[0.98]' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                >
                  {product.stock > 0 ? (
                      <>
                        <span>Agregar</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                      </>
                  ) : 'Sin Stock'}
                </button>
              ) : (
                <div className="flex items-center justify-between border border-primary/20 rounded-lg bg-primary/5 p-1">
                   <button onClick={handleDecrease} className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-primary font-bold shadow-sm hover:bg-gray-50">-</button>
                   <span className="text-sm font-bold text-primary px-2">{itemInCart.quantity}</span>
                   <button onClick={handleIncrease} className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-primary font-bold shadow-sm hover:bg-gray-50">+</button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación para Admins */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar "${product.name}" de la base de datos?`}
        confirmText="Sí, Eliminar"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}