import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../../stores/authStore';
import { API_URL } from '../../../utils/api';
import {
    XIcon, MenuIcon, LayoutDashboardIcon, ShoppingBagIcon, PackageIcon, LifeBuoyIcon, SettingsIcon,
    HomeIcon, WrenchIcon, MessageSquareIcon, LogOutIcon, UserIcon, HeartIcon, ZapIcon, ChevronDownIcon
} from '../../SharedIcons';

interface Category {
    id: number;
    nombre: string;
    subcategorias?: Category[];
}

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [showCategories, setShowCategories] = useState(false);

    const { user, isAuthenticated, logout } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        setIsClient(true);

        fetch(`${API_URL}/categories`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setCategories(data.data);
            })
            .catch(console.error);
    }, []);


    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isClient) return null;

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    const menuContent = (
        <>

            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />


            <div className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white z-[70] shadow-2xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>


                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <span className="text-xl font-black text-gray-900 tracking-tight">Menú</span>
                    <button
                        onClick={toggleMenu}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all active:scale-95"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>


                <div className="flex-1 overflow-y-auto px-6 py-8">


                    <div className="mb-10">
                        {isAuthenticated ? (
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg shadow-gray-200">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-400'}`}>
                                        {user?.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg leading-none mb-1">{user?.nombre}</p>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{isAdmin ? 'Administrador' : 'Cliente'}</p>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <a href={`/cuenta/perfil/${user?.id}`} onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium">
                                        <UserIcon className="w-4 h-4" /> Mi Perfil
                                    </a>
                                    {!isAdmin ? (
                                        <>
                                            <a href="/cuenta/miscompras" onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium">
                                                <ShoppingBagIcon className="w-4 h-4" /> Mis Compras
                                            </a>
                                            <a href="/cuenta/favoritos" onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium">
                                                <HeartIcon className="w-4 h-4" /> Favoritos
                                            </a>
                                        </>
                                    ) : (
                                        <a href="/admin" onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 transition-all text-sm font-bold border border-purple-500/30">
                                            <ZapIcon className="w-4 h-4" /> Panel Admin
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                                <p className="text-gray-900 font-bold text-lg mb-2">¡Bienvenido!</p>
                                <p className="text-gray-500 text-sm mb-5">Inicia sesión para acceder a tu perfil y compras.</p>
                                <div className="grid gap-3">
                                    <a href="/auth/login" onClick={handleLinkClick} className="w-full py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                        Ingresar
                                    </a>
                                    <a href="/auth/registro" onClick={handleLinkClick} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 block">
                                        Crear Cuenta
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>


                    <nav className="space-y-1">
                        {isAdmin ? (
                            <>
                                <a href="/admin" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-purple-50 hover:text-purple-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                        <LayoutDashboardIcon className="h-5 w-5" />
                                    </span>
                                    Dashboard
                                </a>

                                <a href="/admin/ventas" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-green-50 hover:text-green-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                                        <ShoppingBagIcon className="h-5 w-5" />
                                    </span>
                                    Ventas
                                </a>

                                <a href="/admin/productos" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-blue-50 hover:text-blue-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <PackageIcon className="h-5 w-5" />
                                    </span>
                                    Productos
                                </a>

                                <a href="/admin/soporte" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-orange-50 hover:text-orange-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                        <LifeBuoyIcon className="h-5 w-5" />
                                    </span>
                                    Soporte
                                </a>

                                <a href="/admin/configuracion" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 hover:text-gray-800 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 group-hover:text-gray-800 transition-colors">
                                        <SettingsIcon className="h-5 w-5" />
                                    </span>
                                    Configuración
                                </a>
                            </>
                        ) : (
                            <>
                                <a href="/" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:text-primary transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <HomeIcon className="h-5 w-5" />
                                    </span>
                                    Inicio
                                </a>


                                <div className="overflow-hidden">
                                    <button
                                        onClick={() => setShowCategories(!showCategories)}
                                        className={`w-full flex items-center justify-between px-4 py-4 rounded-xl font-semibold transition-all group ${showCategories ? 'bg-gray-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-primary'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`p-2 rounded-lg transition-colors ${showCategories ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                                <PackageIcon className="h-5 w-5" />
                                            </span>
                                            Productos
                                        </div>
                                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`} />
                                    </button>

                                    <div className={`transition-all duration-300 ease-in-out ${showCategories ? 'max-h-[800px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                                        <div className="ml-[3.5rem] mt-2 space-y-1 border-l-2 border-gray-100 pl-3">
                                            <a href="/tienda/productos" onClick={handleLinkClick} className="block py-2 px-3 text-sm font-bold text-primary hover:translate-x-1 transition-transform">ver todo</a>
                                            {categories.map(cat => (
                                                <a key={cat.id} href={`/tienda/productos?categoryId=${cat.id}`} onClick={handleLinkClick} className="block py-2 px-3 text-sm font-medium text-gray-500 hover:text-gray-900 hover:translate-x-1 transition-transform">
                                                    {cat.nombre}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <a href="/tienda/servicios" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:text-primary transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <WrenchIcon className="h-5 w-5" />
                                    </span>
                                    Servicios
                                </a>

                                <a href="/info/contacto" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:text-primary transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <MessageSquareIcon className="h-5 w-5" />
                                    </span>
                                    Contacto
                                </a>
                            </>
                        )}
                    </nav>

                    {isAuthenticated && (
                        <div className="mt-10 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOutIcon className="h-5 w-5" />
                                Cerrar Sesión
                            </button>
                        </div>
                    )}

                    <div className="mt-8 text-center text-xs text-gray-300 font-mono">
                        v1.0.0 • PC FIX
                    </div>

                </div>
            </div>
        </>
    );

    return (
        <div className="md:hidden">
            <button
                onClick={toggleMenu}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                aria-label="Menú"
            >
                <MenuIcon className="w-7 h-7" />
            </button>

            {isOpen && isClient ? createPortal(menuContent, document.body) : null}
        </div>
    );
}
