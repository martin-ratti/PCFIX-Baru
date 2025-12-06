import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

interface Category {
  id: number;
  nombre: string;
  subcategorias?: Category[];
}

interface Props {
  initialCategories?: Category[];
}

export default function CategoryDropdown({ initialCategories = [] }: Props) {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (initialCategories.length === 0) {
      fetch('http://localhost:3002/api/categories')
        .then(res => res.json())
        .then(data => data.success && setCategories(data.data))
        .catch(console.error);
    }
  }, [initialCategories]);

  if (!isClient || user?.role === 'ADMIN') return null;

  return (
    <div
      className="relative group z-50"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors py-2 font-medium group-hover:text-primary cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        Categorías
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
      </button>


      <div className={`absolute top-full left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-100 transition-all duration-200 origin-top-left ${isOpen ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible -translate-y-2'}`}>
        <div className="py-2">
          {categories.length > 0 ? categories.map((cat) => (
            <div key={cat.id} className="group/item relative">


              <a
                href={`/productos?categoryId=${cat.id}`}
                className="flex justify-between items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium"
              >
                <span>{cat.nombre}</span>
                {cat.subcategorias && cat.subcategorias.length > 0 && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-400 group-hover/item:text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </a>


              {cat.subcategorias && cat.subcategorias.length > 0 && (
                <div className="absolute left-full top-0 w-56 h-full hidden group-hover/item:block">

                  <div className="absolute left-0 top-0 h-full w-4 -ml-2 bg-transparent"></div>

                  <div className="ml-2 bg-white rounded-lg shadow-xl border border-gray-100 animate-in fade-in slide-in-from-left-2 duration-200 overflow-hidden">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                        {cat.nombre}
                      </div>
                      {cat.subcategorias.map(sub => (
                        <a key={sub.id} href={`/productos?categoryId=${sub.id}`} className="block px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors">
                          {sub.nombre}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : <div className="px-4 py-3 text-sm text-gray-400 text-center">Cargando...</div>}
        </div>
      </div>
    </div>
  );
}