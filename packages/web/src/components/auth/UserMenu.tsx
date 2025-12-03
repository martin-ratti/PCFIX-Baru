import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { navigate } from 'astro:transitions/client'; 

export default function UserMenu() {
  const store = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Estado para el dropdown
  const menuRef = useRef<HTMLDivElement>(null); // Referencia para cerrar al hacer clic fuera

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);


  if (!isClient) return null;

  if (!store.isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <a 
          href="/login" 
          className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
        >
          Ingresar
        </a>
        <a 
          href="/registro" 
          className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Registrarse
        </a>
      </div>
    );
  }

  // --- UI Usuario Autenticado (Dropdown) ---
  const user = store.user;
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    store.logout();
    window.location.href = '/'; // Recarga forzada para limpiar la sesión
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón Tigger: Muestra el nombre y abre el menú */}
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 p-1.5 rounded-full bg-white/50 hover:bg-white/70 transition-colors shadow-sm"
        title={`Hola, ${user?.nombre}`}
      >
        {/* Avatar Simple (Inicial del nombre) */}
        <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
          {user?.nombre?.charAt(0) || 'U'}
        </span>
        <span className="text-sm font-medium text-secondary hidden md:inline whitespace-nowrap">
          {user?.nombre}
        </span>
        {/* Flecha de Dropdown */}
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {/* Contenido del Dropdown Menu */}
      <div 
        className={`
          absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-2xl border border-gray-100 py-2 
          transition-all duration-200 z-50 transform origin-top-right
          ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 hidden'}
        `}
      >
        {/* Info del Perfil */}
        <div className="px-4 py-2 border-b border-gray-100 mb-2">
          <p className="font-bold text-secondary truncate">{user?.nombre} {user?.apellido}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        {/* Menú de Opciones */}
        <a href={`/perfil/${user?.id}`} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0H4.501z" /></svg>
          Mi Perfil
        </a>
        <a href="/miscompras" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A3.375 3.375 0 0010.5 11.625v2.625m-6 2.25l2.25-2.25m0 0l-2.25-2.25m2.25 2.25h13.5m-13.5 0v2.25c0 .621.504 1.125 1.125 1.125h1.5l2.25-2.25m-4.5 0H14m0 0h2.25m-2.25-4.5v-2.25m0 0v2.25m0-2.25h-1.5m0 0h-1.5m-1.5m4.5v2.25m0-2.25m0 0h-1.5m-1.5m1.5v2.25m0-2.25m0 0h-1.5" /></svg>
          Mis Compras
        </a>
        <a href="/favoritos" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          Favoritos
        </a>

        {/* Separator */}
        <div className="my-2 border-t border-gray-100"></div>

        {/* Admin Link (Si aplica) */}
        {isAdmin && (
            <a href="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 font-bold hover:bg-purple-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.385.174.758.308 1.109l1.044 2.515a1.125 1.125 0 01-.606 1.488l-.877.577a41.243 41.243 0 01-.527.424m0 4.242l-.527.424m-1.045 1.05l1.044 2.515c.134.35.245.724.308 1.109l.213 1.281c.09.542.56.94 1.11.94h2.593c.55 0 1.02-.398 1.11-.94l.213-1.281c.063-.385.174-.758.308-1.109l1.044-2.515a1.125 1.125 0 01-.606-1.488l-.877-.577c-.247-.161-.498-.323-.75-.485m0 0v-2.708l.182-.092m0 0a48.11 48.11 0 00-1.205-.28m0 2.708l.182.092m0 0a48.11 48.11 0 00-1.205.28M4.775 9.098a48.11 48.11 0 012.55-1.171M4.775 9.098a48.11 48.11 0 002.55 1.171m0 0v1.516a.78.78 0 01-.152.437l-.523.633M7.325 11.77a48.625 48.625 0 00-1.518.523l-.152.437V18a1.5 1.5 0 001.5 1.5h1.761m-3.006-7.857l.182-.092m0 0a48.337 48.337 0 00-1.205-.28m0 2.708l.182.092m0 0a48.337 48.337 0 00-1.205.28M7.325 11.77L15.42 4.5l-2.083-5.007c-.448-1.077-1.976-1.077-2.424 0L7.325 4.5z" /></svg>
              Panel Admin
            </a>
        )}
        
        {/* Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}