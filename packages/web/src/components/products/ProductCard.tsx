import React from 'react';
import { useCartStore } from '../../stores/cartStore';
import type { Product } from '../../data/mock-data';

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
  const itemInCart = items.find((item) => item.id === product.id);

  // Adaptador rápido para cumplir con la interfaz del store
  const handleAddToCart = () => {
    if (product.stock > 0) {
      addItem({
        ...product,
        description: product.description || '',
        slug: product.slug || product.id
      });
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl h-full flex flex-col hover:shadow-2xl transition-shadow duration-300">
      <a href={`/producto/${product.id}`} className="block relative group">
        <div className="overflow-hidden">
            <img 
                className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500" 
                src={product.imageUrl} 
                alt={product.imageAlt} 
            />
        </div>
      </a>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-secondary flex-grow mb-2">{product.name}</h3>
        <div className="mt-auto">
          <div className="mb-4">
            {product.originalPrice ? (
                <div className="flex items-center gap-2">
                <p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted line-through">${product.originalPrice.toLocaleString('es-AR')}</p>
                </div>
            ) : (
                <p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
            )}
          </div>

          {!itemInCart ? (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-primary text-light font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
            </button>
          ) : (
            <div className="flex items-center justify-center border border-muted rounded-lg bg-gray-50">
              <button onClick={() => decreaseQuantity(product.id)} className="px-4 py-2 text-lg hover:bg-gray-200 rounded-l-lg font-bold">-</button>
              <span className="px-5 py-2 text-lg font-bold text-primary">{itemInCart.quantity}</span>
              <button onClick={() => increaseQuantity(product.id)} className="px-4 py-2 text-lg hover:bg-gray-200 rounded-r-lg font-bold">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}