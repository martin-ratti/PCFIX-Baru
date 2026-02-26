import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { UserIcon, ShoppingBagIcon, MessageCircleIcon, HeartIcon, LogOutIcon, ChevronDownIcon } from '../../SharedIcons';

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
        <a href="/auth/login" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100">Ingresar</a>
        <a href="/auth/registro" className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all transform hover:-translate-y-0.5 active:scale-95">Registrarse</a>
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
        <ChevronDownIcon className={`w-4 h-4 text-gray-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 transition-all duration-200 z-50 transform origin-top-right ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 hidden'}`}>
        <div className="px-4 py-3 border-b border-gray-100 mb-2 bg-gray-50/50">
          <p className="font-bold text-secondary truncate">{user?.nombre} {user?.apellido}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        <a href={`/cuenta/perfil/${user?.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <UserIcon className="w-5 h-5 text-gray-400" />
          Mi Perfil
        </a>

        {!isAdmin && (
          <>
            <a href="/cuenta/miscompras" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <ShoppingBagIcon className="w-5 h-5 text-gray-400" />
              Mis Compras
            </a>

            <a href="/tienda/servicios" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <MessageCircleIcon className="w-5 h-5 text-gray-400" />
              Mis Consultas
            </a>

            <a href="/cuenta/favoritos" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <HeartIcon className="w-5 h-5 text-gray-400" />
              Favoritos
            </a>
          </>
        )}

        <div className="my-2 border-t border-gray-100"></div>

        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
          <LogOutIcon className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}