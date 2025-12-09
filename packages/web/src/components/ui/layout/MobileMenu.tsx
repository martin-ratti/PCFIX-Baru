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
        const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3002/api';
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

    const menuContent = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg text-secondary">Menú</h2>
                    <button onClick={toggleMenu} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* User Section */}
                    <div className="space-y-3">
                        {isAuthenticated ? (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${isAdmin ? 'bg-purple-600' : 'bg-primary'}`}>
                                        {user?.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 leading-tight">{user?.nombre}</p>
                                        <p className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'Cliente'}</p>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <a href={`/cuenta/perfil/${user?.id}`} className="text-sm text-gray-700 hover:text-primary font-medium flex items-center gap-2">
                                        <span>👤 Mi Perfil</span>
                                    </a>
                                    {!isAdmin && (
                                        <>
                                            <a href="/cuenta/miscompras" className="text-sm text-gray-700 hover:text-primary font-medium">🛍️ Mis Compras</a>
                                            <a href="/cuenta/favoritos" className="text-sm text-gray-700 hover:text-primary font-medium">❤️ Favoritos</a>
                                        </>
                                    )}
                                    {isAdmin && (
                                        <a href="/admin" className="text-sm text-purple-700 font-bold hover:text-purple-900">⚡ Panel Admin</a>
                                    )}
                                    <button onClick={handleLogout} className="text-sm text-red-600 font-bold hover:text-red-800 text-left mt-2 border-t border-blue-200 pt-2">
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <a href="/auth/login" className="text-center py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors">Ingresar</a>
                                <a href="/auth/registro" className="text-center py-2.5 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all active:scale-95">Registrarse</a>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* Navigation */}
                    <nav className="flex flex-col space-y-1">
                        <a href="/" className="px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">Inicio</a>

                        {/* Categories Accordion */}
                        <div>
                            <button
                                onClick={() => setShowCategories(!showCategories)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                            >
                                <span>Productos</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showCategories ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="pl-4 pr-2 py-1 space-y-1 bg-gray-50/50 rounded-b-lg mb-2">
                                    <a href="/tienda/productos" className="block px-4 py-2 text-sm text-primary font-bold hover:bg-white rounded-md">Ver Todo</a>
                                    {categories.map(cat => (
                                        <div key={cat.id}>
                                            <a href={`/tienda/productos?categoryId=${cat.id}`} className="block px-4 py-2 text-sm text-gray-600 hover:text-primary hover:bg-white rounded-md transition-colors">
                                                {cat.nombre}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <a href="/tienda/servicios" className="px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">Servicios</a>
                        <a href="/info/contacto" className="px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">Contacto</a>
                        <a href="/info/faq" className="px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">Ayuda</a>
                    </nav>

                </div>
            </div>
        </>
    );

    return (
        <div className="md:hidden">
            {/* Hamburger Button */}
            <button
                onClick={toggleMenu}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Menú"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            {isOpen && isClient ? createPortal(menuContent, document.body) : null}
        </div>
    );
}
