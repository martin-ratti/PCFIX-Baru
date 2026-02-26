import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import cartIcon from '../../../assets/cart.png';

export default function CartIcon() {
  const items = useCartStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevItemsCount = useRef(0);

  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    const currentCount = items.reduce((total, item) => total + item.quantity, 0);
    if (currentCount > prevItemsCount.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    prevItemsCount.current = currentCount;
  }, [items]);

  if (isClient && user?.role === 'ADMIN') return null;

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <a
      href="/tienda/carrito"
      className={`relative p-2 transition-transform hover:scale-110 focus-ring rounded-lg ${isAnimating ? 'animate-bounce-once' : ''}`}
      aria-label={`Carrito de compras${totalItems > 0 ? `, ${totalItems} productos` : ', vacío'}`}
    >
      <img
        src={cartIcon.src}
        alt=""
        className="w-8 h-8"
        aria-hidden="true"
        width="32"
        height="32"
      />

      {isClient && totalItems > 0 && (
        <span
          className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4"
          aria-hidden="true"
        >
          {totalItems}
        </span>
      )}
    </a>
  );
}