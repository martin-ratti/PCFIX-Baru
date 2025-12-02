import React, { useState } from 'react';
import { useCartStore } from '../stores/cartStore';
import type { Product } from '../data/mock-data'; // Importamos el tipo Product

interface AddToCartProps {
  product: Product; // Recibimos el producto completo
  stock: number;
}

export default function AddToCart({ product, stock }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore(); // Obtenemos la acción para agregar

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(stock, prev + 1));
  };

  // Nueva función que agrega al carrito y redirige
  const handleAddToCartAndRedirect = () => {
    if (stock > 0) {
      // Usamos un bucle para agregar la cantidad seleccionada
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }
      // Redirige al usuario a la página del carrito
      window.location.href = '/carrito';
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center gap-4">
        <p className="font-semibold">Cantidad:</p>
        <div className="flex items-center border border-muted rounded">
          <button onClick={handleDecrement} className="px-3 py-1 text-lg hover:bg-gray-200">-</button>
          <span className="px-4 py-1 text-lg">{quantity}</span>
          <button onClick={handleIncrement} className="px-3 py-1 text-lg hover:bg-gray-200">+</button>
        </div>
      </div>
      
      {/* CAMBIO: Contenedor para centrar el botón */}
      <div className="flex justify-center">
        <button 
          onClick={handleAddToCartAndRedirect}
          disabled={stock === 0}
          // CAMBIO: Se ajusta el tamaño y se quita el ancho completo
          className="bg-primary text-light font-bold py-2 px-8 rounded-lg text-md hover:bg-opacity-90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
        >
          {stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
        </button>
      </div>
    </div>
  );
}