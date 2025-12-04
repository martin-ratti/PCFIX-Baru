import React, { useEffect } from 'react';
// Importamos el store y el tipo ServiceItem
import { useServiceStore, type ServiceItem } from '../../../stores/serviceStore';

export default function ServicePriceList() {
  const { items, fetchItems, isLoading } = useServiceStore();

  useEffect(() => {
    if (items.length === 0) fetchItems();
  }, []);

  if (isLoading && items.length === 0) return <div className="p-10 text-center text-gray-500">Cargando precios...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {/* Ahora TypeScript sabe que 'p' es un ServiceItem */}
        {items.map((p: ServiceItem) => (
            <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg text-secondary mb-2">{p.title}</h3>
                <p className="text-3xl font-black text-primary mb-3">
                    ${p.price.toLocaleString('es-AR')}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
            </div>
        ))}
    </div>
  );
}