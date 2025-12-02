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
    originalPrice?: number;
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

  // --- LÓGICA CLIENTE ---
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock > 0) {
      addItem({ ...product, description: product.description || '', slug: product.slug || product.id });
      addToast('Producto agregado', 'success');
      await navigate('/carrito');
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (itemInCart && itemInCart.quantity >= product.stock) {
      addToast(`Stock máximo alcanzado (${product.stock})`, 'error');
      return;
    }
    increaseQuantity(product.id);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    decreaseQuantity(product.id);
  };

  // --- LÓGICA ADMIN ---
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
        addToast(data.error, 'error');
      }
    } catch (err) {
      addToast('Error de conexión al eliminar', 'error');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigate(`/admin/editar/${product.id}`);
  };

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-xl h-full flex flex-col hover:shadow-2xl transition-shadow duration-300 relative group">
        {isAdmin && (
          <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded z-10 backdrop-blur-sm border border-gray-700">
            ID: {product.id}
          </div>
        )}

        <a href={`/producto/${product.id}`} className="block overflow-hidden">
          <img className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-500" src={product.imageUrl} alt={product.imageAlt} />
        </a>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-secondary flex-grow mb-2 hover:text-primary transition-colors">
            <a href={`/producto/${product.id}`}>{product.name}</a>
          </h3>
          
          <div className="mt-auto">
            <div className="mb-4 flex items-baseline justify-between">
              <p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
              {isAdmin && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Stock: {product.stock}</span>}
            </div>

            {isAdmin ? (
              <div className="flex gap-2">
                <button onClick={handleEdit} className="flex-1 bg-blue-600 text-white font-bold py-2 px-2 rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">
                  Editar
                </button>
                <button onClick={handleDeleteClick} className="flex-1 bg-white text-red-600 font-bold py-2 px-2 rounded text-sm hover:bg-red-50 border border-red-200 transition-colors shadow-sm">
                  Eliminar
                </button>
              </div>
            ) : (
              !itemInCart ? (
                <button onClick={handleAddToCart} disabled={product.stock === 0} className="w-full bg-primary text-light font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-muted disabled:cursor-not-allowed shadow-md hover:shadow-lg">
                  {product.stock > 0 ? 'Agregar y Comprar' : 'Sin Stock'}
                </button>
              ) : (
                <div className="flex items-center justify-center border border-muted rounded-lg bg-gray-50 shadow-inner">
                  <button onClick={handleDecrease} className="px-4 py-2 text-lg font-bold hover:bg-gray-200 rounded-l-lg text-gray-600">-</button>
                  <span className="px-5 py-2 text-lg font-bold text-primary">{itemInCart.quantity}</span>
                  <button onClick={handleIncrease} className="px-4 py-2 text-lg font-bold hover:bg-gray-200 rounded-r-lg text-gray-600">+</button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar "${product.name}"? Esta acción enviará el producto a la papelera.`}
        confirmText="Sí, Eliminar"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}