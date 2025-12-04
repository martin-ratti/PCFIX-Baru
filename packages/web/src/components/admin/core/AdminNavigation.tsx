import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function AdminNavigation() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient) return null;

  // Si NO es admin, no mostramos nada (dejamos que el Header muestre lo default si se pudiera,
  // pero como reemplazamos contenido, aquí mostramos el menú de usuario normal)
  
  // Estrategia: Este componente va a VIVIR en el Header y decidir qué mostrar.
  
  if (user?.role === 'ADMIN') {
    return (
      <div className="hidden md:flex items-center space-x-6">
        <a href="/admin" className="text-secondary hover:text-primary font-bold">Dashboard</a>
        <a href="/admin/productos" className="text-secondary hover:text-primary font-bold">Inventario</a>
        <a href="/admin/ventas" className=" hover:text-primary font-bold text-gray-400 cursor-not-allowed" title="Próximamente">Ventas</a>
      </div>
    );
  }

  // Si es usuario normal, mostramos la navegación de tienda
  return (
    <div className="hidden md:flex items-center space-x-8">
       {/* Aquí iría CategoryDropdown y Nosotros, pero como esto es una isla, 
           no podemos renderizar componentes de Astro dentro.
           
           SOLUCIÓN: Manejar esto en el .astro con lógica de CSS o slots es complejo.
           Lo más limpio es que este componente SOLO muestre links de admin si es admin,
           y si no, retorne null. Y en el Header.astro ocultamos lo otro con CSS/JS o
           simplemente ponemos esto AL LADO.
       */}
       return null;
    </div>
  );
}