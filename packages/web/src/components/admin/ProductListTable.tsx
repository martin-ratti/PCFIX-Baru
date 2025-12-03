import React, { useState, useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../shared/ConfirmModal';
import UpdateStockModal from './UpdateStockModal'; 
import DiscountModal from './DiscountModal'; 
import { useToastStore } from '../../stores/toastStore';

interface Product { 
  id: number; 
  nombre: string; 
  precio: string; 
  precioOriginal?: string | null; 
  stock: number; 
  isFeatured: boolean; // Nuevo campo
  categoria: { nombre: string }; 
}

interface Category { id: number; nombre: string; }

export default function ProductListTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState(false);
  
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToUpdateStock, setProductToUpdateStock] = useState<Product | null>(null); 
  const [productToDiscount, setProductToDiscount] = useState<Product | null>(null); 
  
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('filter') === 'lowStock') setShowLowStock(true);

    fetch('http://localhost:3002/api/categories')
      .then(res => res.json())
      .then(data => data.success && setCategories(data.data));
  }, []);

  useEffect(() => { fetchProducts(); }, [filterCat, showLowStock]);

const fetchProducts = () => {
    const params = new URLSearchParams();
    if (filterCat) params.append('categoryId', filterCat);
    if (showLowStock) params.append('lowStock', 'true');
    params.append('limit', '50'); 

    fetch(`http://localhost:3002/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => { 
          if (data.success) {
              setProducts(data.data);
              if (data.data.length === 50) {
                  addToast("Mostrando primeros 50 resultados. Usa filtros para ver más.", 'info');
              }
          } 
      });
  };

  // Funciones de acción existentes...
  const handleDelete = async () => { /* ... */ 
    if (!productToDelete) return;
    try {
      await fetch(`http://localhost:3002/api/products/${productToDelete.id}`, { method: 'DELETE' });
      addToast('Producto eliminado', 'success');
      fetchProducts();
    } catch (e) { addToast('Error de conexión', 'error'); } 
    finally { setProductToDelete(null); }
  };

  const handleStockUpdate = async (newStock: number) => { /* ... */ 
    if (!productToUpdateStock) return;
    try {
      const formData = new FormData();
      formData.append('stock', newStock.toString());
      await fetch(`http://localhost:3002/api/products/${productToUpdateStock.id}`, { method: 'PUT', body: formData });
      addToast('Stock actualizado', 'success');
      fetchProducts(); 
    } catch (e) { addToast('Error de conexión', 'error'); }
    finally { setProductToUpdateStock(null); }
  };

  const handleDiscountUpdate = async (newPrice: number, originalPrice: number | null) => { /* ... */ 
    if (!productToDiscount) return;
    try {
      const payload = { precio: newPrice, precioOriginal: originalPrice };
      await fetch(`http://localhost:3002/api/products/${productToDiscount.id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });
      addToast('Oferta aplicada', 'success');
      fetchProducts(); 
    } catch (e) { addToast('Error de conexión', 'error'); }
    finally { setProductToDiscount(null); }
  };

  // NUEVA: Alternar Destacado
  const handleToggleFeatured = async (product: Product) => {
    try {
      const newStatus = !product.isFeatured;
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isFeatured: newStatus } : p));

      await fetch(`http://localhost:3002/api/products/${product.id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newStatus }) 
      });
      addToast(newStatus ? 'Producto destacado' : 'Quitado de destacados', 'success');
    } catch (e) {
      fetchProducts(); // Revertir
      addToast('Error al actualizar', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50 gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-secondary flex items-center gap-2">Inventario</h3>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="text-sm border-gray-300 rounded-md p-2 shadow-sm">
            <option value="">Todas las Categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={showLowStock} onChange={(e) => setShowLowStock(e.target.checked)} className="rounded text-primary" />
            Solo Stock Bajo
          </label>
        </div>
        <button onClick={() => navigate('/admin/nuevo')} className="bg-primary text-white text-sm px-4 py-2 rounded hover:bg-opacity-90">+ Nuevo</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-500">#{p.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-500"><span className="px-2 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{p.categoria.nombre}</span></td>
                  <td className="px-6 py-4 text-sm font-mono">
                    <div className="flex flex-col">
                      {p.precioOriginal ? (
                         <>
                           <span className="text-red-600 font-bold">${Number(p.precio).toLocaleString('es-AR')}</span>
                           <span className="text-xs text-gray-400 line-through">${Number(p.precioOriginal).toLocaleString('es-AR')}</span>
                         </>
                      ) : (
                         <span className="text-gray-700">${Number(p.precio).toLocaleString('es-AR')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded font-bold text-xs ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'text-gray-700 bg-gray-100'}`}>
                      {p.stock} u.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      
                      {/* BOTÓN DESTACAR (ESTRELLA) */}
                      <button onClick={() => handleToggleFeatured(p)} className={`p-1.5 rounded-full transition-all ${p.isFeatured ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'}`} title="Destacar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                      </button>

                      <button onClick={() => setProductToDiscount(p)} className={`p-1.5 rounded-full transition-colors ${p.precioOriginal ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600'}`} title="Oferta">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                      </button>
                      
                      <button onClick={() => setProductToUpdateStock(p)} className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-full" title="Stock">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                      </button>

                      <button onClick={() => navigate(`/admin/editar/${p.id}`)} className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-full" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      </button>
                      
                      <button onClick={() => setProductToDelete(p)} className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-full" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <ConfirmModal isOpen={!!productToDelete} title="Eliminar" message="¿Borrar producto?" confirmText="Eliminar" isDanger={true} onConfirm={handleDelete} onCancel={() => setProductToDelete(null)} />
      <UpdateStockModal isOpen={!!productToUpdateStock} productName={productToUpdateStock?.nombre || ''} currentStock={productToUpdateStock?.stock || 0} onConfirm={handleStockUpdate} onCancel={() => setProductToUpdateStock(null)} />
      <DiscountModal isOpen={!!productToDiscount} product={productToDiscount} onConfirm={handleDiscountUpdate} onCancel={() => setProductToDiscount(null)} />
    </div>
  );
}