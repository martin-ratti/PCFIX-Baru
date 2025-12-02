import React, { useState } from 'react';
import { navigate } from 'astro:transitions/client';

export default function SearchBar() {
  const [term, setTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      // Redirigir a la página de productos con el query param
      // encodeURIComponent asegura que espacios y símbolos pasen bien
      navigate(`/productos?search=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md hidden md:block">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar productos (ej: i9, RTX)..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-secondary placeholder-gray-400"
        />
        <button 
          type="submit"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>
    </form>
  );
}