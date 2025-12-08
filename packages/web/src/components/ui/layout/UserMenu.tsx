import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function UserMenu() {
  const store = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIsClient(true), []);

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
        <a href="/auth/login" className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100">Ingresar</a>
        <a href="/auth/registro" className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all transform hover:-translate-y-0.5 active:translate-y-0">Registrarse</a>
      </div>
    );
  }

  const user = store.user;
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    store.logout();
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 p-1.5 rounded-full bg-white/50 hover:bg-white/70 transition-colors shadow-sm border border-transparent hover:border-gray-200"
      >
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white ${isAdmin ? 'bg-purple-600' : 'bg-primary'}`}>
          {user?.nombre?.charAt(0).toUpperCase() || 'U'}
        </span>
        <div className="hidden md:flex flex-col items-start leading-none mr-1">
          <span className="text-xs font-bold text-secondary">{user?.nombre}</span>
          {isAdmin && <span className="text-[10px] text-purple-600 font-bold">ADMINISTRADOR</span>}
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      <div className={`absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 transition-all duration-200 z-50 transform origin-top-right ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 hidden'}`}>
        <div className="px-4 py-3 border-b border-gray-100 mb-2 bg-gray-50/50">
          <p className="font-bold text-secondary truncate">{user?.nombre} {user?.apellido}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        <a href={`/cuenta/perfil/${user?.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0H4.501z" /></svg>
          Mi Perfil
        </a>

        {!isAdmin && (
          <>
            <a href="/cuenta/miscompras" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">

              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
              Mis Compras
            </a>

            <a href="/cuenta/mis-consultas" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">

              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
              Mis Consultas
            </a>

            <a href="/cuenta/favoritos" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">

              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.053-4.393 2.365-.796-1.312-2.46-2.365-4.393-2.365C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              Favoritos
            </a>
          </>
        )}

        <div className="my-2 border-t border-gray-100"></div>

        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}