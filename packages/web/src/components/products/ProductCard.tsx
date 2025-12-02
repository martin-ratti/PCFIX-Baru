import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../shared/ConfirmModal';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null; // Puede ser null o number
    imageUrl: string;
    imageAlt: string;
    stock: number;
    slug: string;
    description?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, increaseQuantity, decreaseQuantity } = useCartStore();
  const { user } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const isAdmin = user?.role === 'ADMIN';
  const itemInCart = items.find((item) => item.id === product.id);

  // Calcular porcentaje de descuento si existe precio original
  const discountPercent = (product.originalPrice && product.originalPrice > product.price)
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // --- Handlers ---
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock > 0) {
      addItem({ 
        ...product, 
        description: product.description || '', 
        slug: product.slug || product.id,
        // Aseguramos que originalPrice sea undefined si es null para el store
        originalPrice: product.originalPrice || undefined 
      });
      addToast('Producto agregado', 'success');
      await navigate('/carrito');
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (itemInCart && itemInCart.quantity >= product.stock) {
      addToast('Stock máximo alcanzado', 'error');
      return;
    }
    increaseQuantity(product.id);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    decreaseQuantity(product.id);
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
        addToast('Producto eliminado', 'success'); 
        window.location.reload(); 
      } else {
        addToast(data.error, 'error');
      }
    } catch (err) { addToast('Error al eliminar', 'error'); } 
    finally { setIsDeleteModalOpen(false); }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigate(`/admin/editar/${product.id}`);
  };

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 relative group h-full flex flex-col">
        
        {/* Badge de Oferta */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Badge de Admin */}
        {isAdmin && (
          <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded z-10 backdrop-blur-sm">
            ID: {product.id}
          </div>
        )}

        <a href={`/producto/${product.id}`} className="block overflow-hidden relative pt-[100%]">
          <img 
            className="absolute top-0 left-0 w-full h-full object-contain p-4 transform group-hover:scale-105 transition-transform duration-500" 
            src={product.imageUrl} 
            alt={product.imageAlt} 
          />
        </a>

        <div className="p-4 flex flex-col flex-grow border-t border-gray-50">
          <h3 className="text-base font-bold text-secondary mb-1 leading-tight hover:text-primary transition-colors line-clamp-2 h-10">
            <a href={`/producto/${product.id}`}>{product.name}</a>
          </h3>
          
          <div className="mt-auto pt-3">
            {/* PRECIOS */}
            <div className="mb-3 h-12 flex flex-col justify-end">
              {discountPercent > 0 && product.originalPrice ? (
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-400 line-through">
                    ${product.originalPrice.toLocaleString('es-AR')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-red-600">
                      ${product.price.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xl font-black text-primary">
                  ${product.price.toLocaleString('es-AR')}
                </p>
              )}
            </div>

            {/* BOTONES DE ACCIÓN */}
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleEdit} className="bg-blue-50 text-blue-700 font-bold py-1.5 rounded text-sm hover:bg-blue-100 transition-colors">
                  Editar
                </button>
                <button onClick={handleDeleteClick} className="bg-red-50 text-red-700 font-bold py-1.5 rounded text-sm hover:bg-red-100 transition-colors">
                  Eliminar
                </button>
              </div>
            ) : (
              !itemInCart ? (
                <button 
                  onClick={handleAddToCart} 
                  disabled={product.stock === 0}
                  className={`w-full font-bold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow ${
                    product.stock > 0 
                      ? 'bg-primary text-white hover:bg-opacity-90 active:scale-[0.98]' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {product.stock > 0 ? 'Agregar' : 'Sin Stock'}
                </button>
              ) : (
                <div className="flex items-center justify-between border-2 border-primary/10 rounded-lg bg-primary/5 overflow-hidden">
                  <button onClick={handleDecrease} className="px-3 py-1.5 text-lg font-bold hover:bg-white text-primary transition-colors w-10">-</button>
                  <span className="text-sm font-bold text-primary">{itemInCart.quantity}</span>
                  <button onClick={handleIncrease} className="px-3 py-1.5 text-lg font-bold hover:bg-white text-primary transition-colors w-10">+</button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Eliminar Producto"
        message={`¿Eliminar "${product.name}"?`}
        confirmText="Sí, eliminar"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}