import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';

// Definimos la interfaz localmente para no depender de mock-data si no queremos
interface ProductData {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  stock: number;
  description: string;
  slug: string;
  originalPrice?: number;
}

interface AddToCartProps {
  product: ProductData; 
  stock: number;
}

export default function AddToCart({ product, stock }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore(); 

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(stock, prev + 1));
  };

  const handleAddToCartAndRedirect = () => {
    if (stock > 0) {
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }
      window.location.href = '/carrito';
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center gap-4">
        <p className="font-semibold text-secondary">Cantidad:</p>
        <div className="flex items-center border border-gray-300 rounded bg-white">
          <button onClick={handleDecrement} className="px-3 py-1 text-lg hover:bg-gray-100 transition-colors">-</button>
          <span className="px-4 py-1 text-lg font-medium">{quantity}</span>
          <button onClick={handleIncrement} className="px-3 py-1 text-lg hover:bg-gray-100 transition-colors">+</button>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button 
          onClick={handleAddToCartAndRedirect}
          disabled={stock === 0}
          className="bg-primary text-light font-bold py-3 px-8 rounded-lg text-md hover:bg-opacity-90 transition-transform hover:scale-105 active:scale-95 disabled:bg-muted disabled:cursor-not-allowed disabled:transform-none w-full md:w-auto"
        >
          {stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
        </button>
      </div>
    </div>
  );
}