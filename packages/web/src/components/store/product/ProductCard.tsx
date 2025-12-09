import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { useToastStore } from '../../../stores/toastStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import StockAlertModal from './StockAlertModal';
import { fetchApi } from '../../../utils/api';

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
    categoria?: { nombre: string };
  };
  disableTransition?: boolean;
}

export default function ProductCard({ product, disableTransition = false }: ProductCardProps) {
  const { items, addItem, increaseQuantity, decreaseQuantity } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorite, toggleFavoriteOptimistic } = useFavoritesStore();
  const addToast = useToastStore(s => s.addToast);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const isAdmin = isClient && user?.role === 'ADMIN';
  const isFavorited = isClient ? isFavorite(Number(product.id)) : false;
  const itemInCart = isClient ? items.find((item) => item.id === product.id) : null;

  const isService = product.stock > 90000 || product.categoria?.nombre.toLowerCase().includes('servicio');

  const discountPercent = (product.originalPrice && product.originalPrice > product.price)
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const hasStock = product.stock > 0;

  const transitionStyle = disableTransition ? {} : { viewTransitionName: `image-${product.id}` };
  const titleTransitionStyle = disableTransition ? {} : { viewTransitionName: `title-${product.id}` };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/producto/${product.id}`;
    if (navigator.share) { try { await navigator.share({ title: product.name, text: product.name, url }); } catch (e) { } }
    else { navigator.clipboard.writeText(url); addToast("Copiado", 'info'); }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { addToast("Inicia sesión", 'info'); return; }

    // Optimistic toggle via store
    if (user?.id) {
      toggleFavoriteOptimistic(user.id, Number(product.id));
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock > 0) {
      addItem({
        ...product,
        description: product.description || '',
        slug: product.slug || product.id,
        originalPrice: product.originalPrice || undefined
      });
      addToast('Agregado', 'success');
    }
  };

  const handleEdit = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); navigate(`/admin/editar/${product.id}`); };
  const handleDeleteClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => { try { await fetchApi(`/products/${product.id}`, { method: 'DELETE' }); addToast('Eliminado', 'success'); window.location.reload(); } catch { addToast('Error', 'error'); } finally { setIsDeleteModalOpen(false); } };

  return (
    <>
      <div
        onClick={() => navigate(`/producto/${product.id}`)}
        className="w-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative group h-full flex flex-col cursor-pointer"
      >
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {!hasStock && !isService && <span className="bg-gray-800 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-gray-600">AGOTADO</span>}
          {discountPercent > 0 && <span className="bg-red-500 text-white text-xs font-bold w-12 py-1 rounded-full shadow-sm animate-pulse-subtle text-center">-{discountPercent}%</span>}
        </div>

        {isClient && !isAdmin && (
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/90 text-gray-400 hover:text-blue-600 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all active:scale-90 focus-ring"
              aria-label="Compartir producto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-full shadow-sm transition-all active:scale-90 focus-ring ${isFavorited ? 'text-red-500 bg-white' : 'text-gray-400 bg-white/90 hover:text-red-500 hover:bg-white'}`}
              aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-pressed={isFavorited}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFavorited ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
                className={`w-5 h-5 transition-transform ${isFavorited ? 'animate-pop' : ''}`}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>
        )}

        <div className="block overflow-hidden relative pt-[100%] bg-white">
          <img className={`absolute top-0 left-0 w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 ${!hasStock && !isService ? 'grayscale opacity-60' : ''}`} src={product.imageUrl || "https://placehold.co/400x400?text=IMG"} alt={product.imageAlt} loading="lazy" style={transitionStyle} />
        </div>

        <div className="p-5 flex flex-col flex-grow border-t border-gray-50 bg-white">
          <h3 className="text-base font-bold text-secondary mb-2 leading-snug line-clamp-2 min-h-[2.5rem]" style={titleTransitionStyle}>{product.name}</h3>

          <div className="mt-auto pt-2">
            <div className="mb-4 min-h-[3rem] flex flex-col justify-end">
              {hasDiscount ? (
                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm text-gray-400 line-through decoration-gray-400 mb-1">
                    ${product.originalPrice?.toLocaleString('es-AR')}
                  </span>
                  <p className="text-xl font-black text-primary">
                    ${product.price.toLocaleString('es-AR')}
                  </p>
                </div>
              ) : (
                <p className="text-xl font-black text-primary">
                  ${product.price.toLocaleString('es-AR')}
                </p>
              )}
            </div>

            {isClient && (
              isAdmin ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleEdit} className="bg-blue-50 text-blue-700 font-bold py-2 rounded-lg text-sm hover:bg-blue-100">Editar</button>
                  <button onClick={handleDeleteClick} className="bg-red-50 text-red-700 font-bold py-2 rounded-lg text-sm hover:bg-red-100">Eliminar</button>
                </div>
              ) : (
                isService ? (
                  <div className="w-full bg-gray-100 text-gray-500 font-bold py-2.5 px-4 rounded-lg text-center text-sm cursor-default flex items-center justify-center gap-2">
                    <span className="text-xl">🛠️</span> Solo en Local
                  </div>
                ) : (
                  !itemInCart ? (
                    hasStock ? (
                      <button
                        onClick={handleAddToCart}
                        className="w-full font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm bg-primary text-white hover:bg-opacity-90 active:scale-95 focus-ring"
                        aria-label={`Agregar ${product.name} al carrito`}
                      >
                        Agregar
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAlertModalOpen(true); }}
                        className="w-full font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm border border-primary text-primary hover:bg-primary hover:text-white flex items-center justify-center gap-2 group/btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        Avísame
                      </button>
                    )
                  ) : (
                    <div className="flex items-center justify-between border border-primary/20 rounded-lg bg-primary/5 p-1" role="group" aria-label="Cantidad en carrito">
                      <button
                        onClick={(e) => { e.preventDefault(); decreaseQuantity(product.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-primary font-bold active:scale-90 focus-ring transition-transform"
                        aria-label="Disminuir cantidad"
                      >-</button>
                      <span className="text-sm font-bold text-primary px-2" aria-live="polite">{itemInCart.quantity}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); increaseQuantity(product.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-primary font-bold active:scale-90 focus-ring transition-transform"
                        aria-label="Aumentar cantidad"
                      >+</button>
                    </div>
                  )
                )
              )
            )}
          </div>
        </div>
      </div>
      <ConfirmModal isOpen={isDeleteModalOpen} title="Eliminar" message="¿Borrar?" confirmText="Sí" isDanger={true} onConfirm={confirmDelete} onCancel={() => setIsDeleteModalOpen(false)} />

      <StockAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        productId={Number(product.id)}
        productName={product.name}
      />
    </>
  );
}