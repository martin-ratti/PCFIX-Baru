import React, { useState, useEffect, useRef } from 'react';
import { navigate } from 'astro:transitions/client';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api';

export default function SearchBar() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsClient(true); }, []);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    if (term.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {

        const res = await fetchApi(`/products?search=${encodeURIComponent(term)}&limit=5`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [term]);

  if (!isClient) return null;
  if (user?.role === 'ADMIN') return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      setIsOpen(false);
      navigate(`/tienda/productos?search=${encodeURIComponent(term.trim())}`);
    }
  };

  const goToProduct = (id: number) => {
    setIsOpen(false);
    setTerm('');
    navigate(`/producto/${id}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-full hidden md:block z-50">
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          placeholder="Buscar productos (ej: SSD, Ram)..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => term.length >= 2 && setIsOpen(true)}
          className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-blue-200/30 bg-blue-900/20 text-white placeholder-blue-200 focus:bg-white focus:text-gray-900 focus:border-white focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-inner"
        />


        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 group-focus-within:text-gray-500 transition-colors">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          )}
        </div>
      </form>


      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-down">
          <ul>
            {results.map((product) => (
              <li key={product.id}>
                <button
                  onClick={() => goToProduct(product.id)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex justify-between items-center group"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {product.nombre}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      {product.categoria?.nombre || 'Producto'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-primary text-sm whitespace-nowrap ml-2">
                    ${Number(product.precio).toLocaleString('es-AR')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div onClick={handleSearch} className="bg-gray-50 p-2 text-center text-xs font-bold text-blue-600 cursor-pointer hover:bg-gray-100 border-t border-gray-100">
            Ver todos los resultados &rarr;
          </div>
        </div>
      )}
    </div>
  );
}