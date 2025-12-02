import React, { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
// 1. Importamos la imagen del carrito como un módulo
import cartIcon from '../assets/cart.png';

export default function CartIcon() {
  const items = useCartStore((state) => state.items);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Este efecto nos asegura que el código solo se ejecute en el navegador,
    // evitando errores de hidratación con Astro.
    setIsClient(true);
  }, []);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <a href="/carrito" className="relative p-2 transition-transform hover:scale-110">
      {/* Contenedor del ícono */}
      <img src={cartIcon.src} alt="Carrito de compras" className="w-8 h-8" />
      
      {/* 2. Burbuja de notificación (solo se muestra si hay items) */}
      {isClient && totalItems > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4">
          {totalItems}
        </span>
      )}
    </a>
  );
}