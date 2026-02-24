import { useEffect } from 'react';
import { useServiceStore, type ServiceItem } from '../../../stores/serviceStore';

export default function ServicePriceList() {
  const { items, fetchItems, isLoading } = useServiceStore();

  
  useEffect(() => {
    fetchItems();
  }, []);

  if (isLoading && items.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[1,2,3,4].map(i => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-48 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-16 bg-gray-100 rounded w-full"></div>
                </div>
            ))}
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {items.map((p: ServiceItem) => (
            <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 duration-300 flex flex-col">
                <h3 className="font-bold text-lg text-secondary mb-2">{p.title}</h3>
                <div className="mt-auto">
                    <p className="text-3xl font-black text-primary mb-3 tracking-tight">
                        ${p.price.toLocaleString('es-AR')}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
                </div>
            </div>
        ))}
    </div>
  );
}