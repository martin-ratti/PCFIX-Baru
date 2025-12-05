import React, { useState, useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import { useAuthStore } from '../../../stores/authStore';

export default function SearchBar() {
  const [term, setTerm] = useState('');
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isClient && user?.role === 'ADMIN') return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      navigate(`/productos?search=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-full hidden md:block">
      <div className="relative group">
        <input
          type="text"
          placeholder="Buscar productos (ej: SSD, Ram DDR4)..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-blue-200/30 bg-blue-900/20 text-white placeholder-blue-200 focus:bg-white focus:text-gray-900 focus:border-white focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-inner"
        />
        <button 
          type="submit"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 group-focus-within:text-gray-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>
    </form>
  );
}