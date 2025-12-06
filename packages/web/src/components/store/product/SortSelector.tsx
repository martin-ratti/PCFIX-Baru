import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';

export default function SortSelector() {
  const [currentSort, setCurrentSort] = useState('');


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrentSort(params.get('sort') || '');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCurrentSort(value);


    const url = new URL(window.location.href);

    if (value) {
      url.searchParams.set('sort', value);
    } else {
      url.searchParams.delete('sort');
    }


    url.searchParams.set('page', '1');

    navigate(url.toString());
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-gray-500 hidden sm:block">Ordenar:</span>
      <div className="relative group">
        <select
          onChange={handleChange}
          value={currentSort}
          className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:border-gray-300 transition-all shadow-sm"
        >
          <option value="">Más Recientes</option>
          <option value="price_asc">Menor Precio</option>
          <option value="price_desc">Mayor Precio</option>
          <option value="name_asc">Nombre (A-Z)</option>
        </select>


        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-primary transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}