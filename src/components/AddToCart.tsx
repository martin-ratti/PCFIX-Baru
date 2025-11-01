import React, { useState } from 'react';

interface AddToCartProps {
  stock: number;
}

export default function AddToCart({ stock }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(stock, prev + 1));
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
      <button className="w-full bg-primary text-light font-bold py-3 px-6 rounded-lg text-lg hover:bg-opacity-90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
        disabled={stock === 0}
      >
        {stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
      </button>
    </div>
  );
}