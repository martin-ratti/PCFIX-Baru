import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { WrenchIcon } from "../../../components/SharedIcons";

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
        {/* Contenedor translúcido para el icono */}
        <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all flex items-center justify-center">
          <WrenchIcon className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors" />
        </div>
        <span>Servicio Técnico</span>
      </a>
    </div>
  );
}