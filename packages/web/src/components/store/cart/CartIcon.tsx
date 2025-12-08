import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import cartIcon from '../../../assets/cart.png';

export default function CartIcon() {
  const items = useCartStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  if (isClient && user?.role === 'ADMIN') return null;

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <a href="/tienda/carrito" className="relative p-2 transition-transform hover:scale-110">
      <img src={cartIcon.src} alt="Carrito de compras" className="w-8 h-8" />

      {isClient && totalItems > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4">
          {totalItems}
        </span>
      )}
    </a>
  );
}