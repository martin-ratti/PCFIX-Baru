import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

import { API_URL } from '../../../utils/api';

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
      fetch(`${API_URL}/categories`)
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
        className="flex items-center gap-2 text-gray-500 hover:text-black transition-all active:scale-95 py-2 font-medium group-hover:text-black cursor-pointer"
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
                href={`/tienda/productos?categoryId=${cat.id}`}
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
                        <a key={sub.id} href={`/tienda/productos?categoryId=${sub.id}`} className="block px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors">
                          {sub.nombre}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : <div className="px-4 py-3 text-sm text-gray-400 text-center">Cargando...</div>}

          
          <div className="border-t border-gray-100 mt-2 pt-2">
            <a
              href="/tienda/productos"
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Ver todo el catálogo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}