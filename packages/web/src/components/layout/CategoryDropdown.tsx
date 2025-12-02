import React, { useState, useEffect } from 'react';

interface Category {
  id: number;
  nombre: string;
}

export default function CategoryDropdown() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3002/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div 
      className="relative group z-50" // group permite detectar hover en hijos
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 text-secondary hover:text-primary transition-colors py-2 font-medium">
        Categorías
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Menú Desplegable */}
      <div 
        className={`absolute top-full left-0 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 origin-top ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
        }`}
      >
        <div className="py-2">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <a
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
              >
                {cat.nombre}
              </a>
            ))
          ) : (
            <span className="block px-4 py-2 text-sm text-gray-400">Cargando...</span>
          )}
        </div>
      </div>
    </div>
  );
}