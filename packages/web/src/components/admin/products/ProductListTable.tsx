import React, { useState, useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import { useToastStore } from '../../../stores/toastStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import { fetchApi } from '../../../utils/api'; // 👇 API Utility

export default function ProductListTable() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const addToast = useToastStore(s => s.addToast);

  // Carga Inicial
  useEffect(() => {
    fetchProducts();
    // 👇 fetchApi limpia
    fetchApi('/categories').then(res => res.json()).then(d => d.success && setCategories(d.data));
    fetchApi('/brands').then(res => res.json()).then(d => d.success && setBrands(d.data));
  }, [selectedCat, selectedBrand, onlyLowStock]);

  // Debounce para búsqueda
  useEffect(() => {
      const timer = setTimeout(() => fetchProducts(), 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = () => {
    // 👇 URL relativa (fetchApi agrega el dominio y /api)
    let url = `/products?limit=50`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (selectedCat) url += `&categoryId=${selectedCat}`;
    if (selectedBrand) url += `&brandId=${selectedBrand}`;
    if (onlyLowStock) url += `&filter=lowStock`;

    fetchApi(url)
      .then(res => res.json())
      .then(data => data.success && setProducts(data.data))
      .catch(console.error);
  };

  const handleDelete = async () => {
      if (!deleteId) return;
      try {
          // 👇 fetchApi DELETE
          const res = await fetchApi(`/products/${deleteId}`, { method: 'DELETE' });
          if (res.ok) {
              addToast('Producto eliminado', 'success');
              fetchProducts();
          } else throw new Error();
      } catch { addToast('Error al eliminar', 'error'); }
      finally { setDeleteId(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* BARRA DE HERRAMIENTAS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Buscador */}
            <div className="relative w-full md:w-1/3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o ID..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filtros */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <select 
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:border-primary outline-none cursor-pointer"
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                >
                    <option value="">Todas las Categorías</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>

                <select 
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:border-primary outline-none cursor-pointer"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                >
                    <option value="">Todas las Marcas</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>

                <button 
                    onClick={() => setOnlyLowStock(!onlyLowStock)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors border ${onlyLowStock ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                    ⚠️ Stock Bajo
                </button>
            </div>

            {/* Botón Nuevo */}
            <a href="/admin/nuevo" className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 shadow-md transition-all whitespace-nowrap flex items-center gap-2">
                <span>+</span> Nuevo
            </a>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold">
                    <tr>
                        <th className="p-4 pl-6">Producto</th>
                        <th className="p-4 hidden md:table-cell">Categoría</th>
                        <th className="p-4">Precio</th>
                        <th className="p-4 text-center">Stock</th>
                        <th className="p-4 text-right pr-6">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {products.map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                            
                            {/* Nombre y Marca */}
                            <td className="p-4 pl-6">
                                <p className="font-bold text-gray-800 line-clamp-1 text-base">{p.nombre}</p>
                                <p className="text-xs text-gray-400 font-medium">{p.marca?.nombre || 'Genérico'} • ID: {p.id}</p>
                            </td>

                            {/* Categoría */}
                            <td className="p-4 hidden md:table-cell">
                                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                                    {p.categoria?.nombre}
                                </span>
                            </td>

                            {/* Precio */}
                            <td className="p-4 font-mono font-bold text-gray-700">
                                ${Number(p.precio).toLocaleString('es-AR')}
                            </td>

                            {/* Stock con Badges */}
                            <td className="p-4 text-center">
                                {p.stock > 90000 ? (
                                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold border border-blue-100">∞ Serv.</span>
                                ) : p.stock <= 5 ? (
                                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold border border-red-100 animate-pulse">{p.stock} Bajo</span>
                                ) : (
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold border border-green-100">{p.stock} OK</span>
                                )}
                            </td>

                            {/* Acciones */}
                            <td className="p-4 text-right pr-6">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => navigate(`/admin/editar/${p.id}`)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Editar">
                                        ✏️
                                    </button>
                                    <button onClick={() => setDeleteId(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Eliminar">
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-gray-400">
                                No se encontraron productos con estos filtros.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Modal de Eliminación */}
        <ConfirmModal 
            isOpen={!!deleteId}
            title="Eliminar Producto"
            message="¿Estás seguro? El producto dejará de ser visible en la tienda pero no se borrará el historial de ventas."
            confirmText="Sí, eliminar"
            isDanger={true}
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
        />
    </div>
  );
}