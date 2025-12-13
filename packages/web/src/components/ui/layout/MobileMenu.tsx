import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../../stores/authStore';

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
        const API_URL = 'https://pcfix-baru-production.up.railway.app/api';
        fetch(`${API_URL}/categories`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setCategories(data.data);
            })
            .catch(console.error);
    }, []);

    // Lock body scroll when menu is open
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
            {/* Backdrop with Glassmorphism */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white z-[70] shadow-2xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <span className="text-xl font-black text-gray-900 tracking-tight">Menú</span>
                    <button
                        onClick={toggleMenu}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-8">

                    {/* User Profile Card */}
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
                                        <span>👤</span> Mi Perfil
                                    </a>
                                    {!isAdmin ? (
                                        <>
                                            <a href="/cuenta/miscompras" onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium">
                                                <span>🛍️</span> Mis Compras
                                            </a>
                                            <a href="/cuenta/favoritos" onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium">
                                                <span>❤️</span> Favoritos
                                            </a>
                                        </>
                                    ) : (
                                        <a href="/admin" onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 transition-all text-sm font-bold border border-purple-500/30">
                                            <span>⚡</span> Panel Admin
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

                    {/* Navigation Links */}
                    <nav className="space-y-1">
                        {isAdmin ? (
                            <>
                                <a href="/admin" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-purple-50 hover:text-purple-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    </span>
                                    Dashboard
                                </a>

                                <a href="/admin/ventas" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-green-50 hover:text-green-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </span>
                                    Ventas
                                </a>

                                <a href="/admin/productos" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-blue-50 hover:text-blue-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    </span>
                                    Productos
                                </a>

                                <a href="/admin/soporte" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-orange-50 hover:text-orange-600 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    </span>
                                    Soporte
                                </a>

                                <a href="/admin/configuracion" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 hover:text-gray-800 transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 group-hover:text-gray-800 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </span>
                                    Configuración
                                </a>
                            </>
                        ) : (
                            <>
                                <a href="/" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:text-primary transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    </span>
                                    Inicio
                                </a>

                                {/* Expandable Categories for Users only */}
                                <div className="overflow-hidden">
                                    <button
                                        onClick={() => setShowCategories(!showCategories)}
                                        className={`w-full flex items-center justify-between px-4 py-4 rounded-xl font-semibold transition-all group ${showCategories ? 'bg-gray-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-primary'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`p-2 rounded-lg transition-colors ${showCategories ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                                            </span>
                                            Productos
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </span>
                                    Servicios
                                </a>

                                <a href="/info/contacto" onClick={handleLinkClick} className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:text-primary transition-all group">
                                    <span className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            {isOpen && isClient ? createPortal(menuContent, document.body) : null}
        </div>
    );
}
