import React, { useState, useEffect } from 'react';

export default function SalesListTable() {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3002/api/sales')
      .then(res => res.json())
      .then(data => data.success && setSales(data.data));
  }, []);

  if (sales.length === 0) return <div className="p-4 bg-white rounded shadow">No hay ventas registradas aún.</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Venta</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sales.map((sale) => (
            <tr key={sale.id}>
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
  );
}