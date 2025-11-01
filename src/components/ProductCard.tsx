import React from 'react';
import type { Product } from '../data/mock-data';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const defaultImageUrl = '/default-product-image.png';

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl transform hover:-translate-y-2 transition-transform duration-300 h-full flex flex-col">
      {/* CAMBIO: La URL ahora usa el 'slug' del producto con la sintaxis correcta */}
      <a href={`/producto/${product.slug}`} className="flex flex-col flex-grow">
        <div className="relative h-48 bg-gray-200 flex items-center justify-center">
          <img
            src={product.imageUrl || defaultImageUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className="p-4 flex flex-col justify-between flex-grow">
          <div>
            <h3 className="text-lg font-bold text-secondary mb-2">{product.name}</h3>
            {product.originalPrice ? (
              <div className="mt-2">
                <p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted line-through">${product.originalPrice.toLocaleString('es-AR')}</p>
              </div>
            ) : (
              <p className="mt-2 text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
            )}
          </div>
          <button className="mt-auto mt-4 w-full bg-primary text-light font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors">
            Agregar al Carrito
          </button>
        </div>
      </a>
    </div>
  );
}