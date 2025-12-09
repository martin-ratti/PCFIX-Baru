import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function PublicLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role === 'ADMIN') return null;

  const linkClass = "flex items-center gap-2 text-gray-500 hover:text-black transition-colors py-2 font-medium group text-sm md:text-base";

  return (
    <div className="flex items-center gap-6">
      <a href="/info/nosotros" className={linkClass}>
        Nosotros
      </a>

      <a href="/tienda/servicios" className={linkClass}>
        {/* Contenedor translúcido para el emoji */}
        <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all flex items-center justify-center">
          {/* Usamos el mismo emoji que en la tarjeta de producto */}
          <span className="text-lg leading-none filter drop-shadow-sm">🛠️</span>
        </div>
        <span>Servicio Técnico</span>
      </a>
    </div>
  );
}