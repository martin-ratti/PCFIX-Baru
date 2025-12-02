import React from 'react';
import { useCartStore } from '../stores/cartStore';
import type { Product } from '../data/mock-data';

export default function ProductCard({ product }: { product: Product }) {
  const { items, addItem, increaseQuantity, decreaseQuantity } = useCartStore();
  const itemInCart = items.find((item) => item.id === product.id);

  const handleAddToCart = () => {
    if (product.stock > 0) {
      addItem(product);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl h-full flex flex-col">
      <a href={`/producto/${product.slug}`} className="block">
        <img className="w-full h-48 object-cover" src={product.imageUrl} alt={product.imageAlt} />
      </a>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-secondary flex-grow">{product.name}</h3>
        <div className="mt-2 mb-4">
          {product.originalPrice ? (
            <>
              <p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
              <p className="text-sm text-muted line-through">${product.originalPrice.toLocaleString('es-AR')}</p>
            </>
          ) : (
            <p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
          )}
        </div>

        <div className="mt-auto">
          {!itemInCart ? (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-primary text-light font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
            </button>
          ) : (
            <div className="flex items-center justify-center border border-muted rounded-lg">
              <button onClick={() => decreaseQuantity(product.id)} className="px-4 py-2 text-lg hover:bg-gray-200 rounded-l-lg">-</button>
              <span className="px-5 py-2 text-lg font-bold">{itemInCart.quantity}</span>
              <button onClick={() => increaseQuantity(product.id)} className="px-4 py-2 text-lg hover:bg-gray-200 rounded-r-lg">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}