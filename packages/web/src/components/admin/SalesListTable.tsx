import React, { useState, useEffect } from 'react';

export default function SalesListTable() {
  const [sales, setSales] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSales = (pageNum: number) => {
    setIsLoading(true);
    fetch(`http://localhost:3002/api/sales?page=${pageNum}&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSales(data.data);
          setTotalPages(data.meta.lastPage);
          setPage(pageNum);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchSales(1); }, []);

  const handlePrev = () => { if (page > 1) fetchSales(page - 1); };
  const handleNext = () => { if (page < totalPages) fetchSales(page + 1); };

  if (!isLoading && sales.length === 0) return <div className="p-4 bg-white rounded shadow text-center text-gray-500">No hay ventas registradas aún.</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-bold text-secondary">Historial de Ventas</h3>
      </div>

      <div className="overflow-x-auto relative min-h-[200px]">
        {isLoading && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">#{sale.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.fecha).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{sale.cliente?.user?.email || 'Cliente eliminado'}</td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">${Number(sale.montoTotal).toLocaleString('es-AR')}</td>
                <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completado</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
         <button onClick={handlePrev} disabled={page === 1} className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm">Anterior</button>
         <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
         <button onClick={handleNext} disabled={page === totalPages} className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm">Siguiente</button>
      </div>
    </div>
  );
}