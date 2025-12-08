import React, { useState, useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import { useToastStore } from '../../../stores/toastStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import UpdateStockModal from './UpdateStockModal';
import DiscountModal from './DiscountModal';
import { fetchApi } from '../../../utils/api';
import ErrorBoundary from '../../ui/feedback/ErrorBoundary';

interface Product { id: number; nombre: string; precio: string; precioOriginal?: string | null; stock: number; isFeatured: boolean; categoria: { nombre: string }; }
interface Category { id: number; nombre: string; }
interface Brand { id: number; nombre: string; }

function ProductListContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]); // Agregué estado para marcas

    // Filtros
    const [filterCat, setFilterCat] = useState<string>('');
    const [filterBrand, setFilterBrand] = useState<string>('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Modales
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [productToUpdateStock, setProductToUpdateStock] = useState<Product | null>(null);
    const [productToDiscount, setProductToDiscount] = useState<Product | null>(null);

    const addToast = useToastStore(s => s.addToast);

    // Carga inicial
    useEffect(() => {
        fetchApi('/categories').then(res => res.json()).then(d => d.success && setCategories(d.data));
        fetchApi('/brands').then(res => res.json()).then(d => d.success && setBrands(d.data));
    }, []);

    // Carga de productos (con debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchProducts(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [filterCat, filterBrand, showLowStock, searchTerm]);

    const fetchProducts = (pageNum: number = page) => {
        setIsLoading(true);
        let url = `/products?page=${pageNum}&limit=10`;

        if (filterCat) url += `&categoryId=${filterCat}`;
        if (filterBrand) url += `&brandId=${filterBrand}`;
        if (showLowStock) url += `&filter=lowStock`;
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

        fetchApi(url)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data);
                    setTotalPages(data.meta?.lastPage || 1);
                    setPage(pageNum);
                }
            })
            .finally(() => setIsLoading(false));
    };

    const handlePrevPage = () => { if (page > 1) fetchProducts(page - 1); };
    const handleNextPage = () => { if (page < totalPages) fetchProducts(page + 1); };

    // --- ACCIONES ---

    const handleDelete = async () => {
        if (!productToDelete) return;
        try {
            await fetchApi(`/products/${productToDelete.id}`, { method: 'DELETE' });
            addToast('Producto eliminado', 'success');
            fetchProducts(page);
        } catch (e) { addToast('Error de conexión', 'error'); }
        finally { setProductToDelete(null); }
    };

    const handleStockUpdate = async (newStock: number) => {
        if (!productToUpdateStock) return;
        try {
            await fetchApi(`/products/${productToUpdateStock.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
            });
            addToast('Stock actualizado', 'success');
            fetchProducts(page);
        } catch (e) { addToast('Error', 'error'); }
        finally { setProductToUpdateStock(null); }
    };

    const handleDiscountUpdate = async (newPrice: number, originalPrice: number | null) => {
        if (!productToDiscount) return;
        try {
            await fetchApi(`/products/${productToDiscount.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ precio: newPrice, precioOriginal: originalPrice })
            });
            addToast('Oferta aplicada', 'success');
            fetchProducts(page);
        } catch (e) { addToast('Error', 'error'); }
        finally { setProductToDiscount(null); }
    };

    const handleToggleFeatured = async (product: Product) => {
        try {
            const newStatus = !product.isFeatured;
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isFeatured: newStatus } : p));
            await fetchApi(`/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFeatured: newStatus })
            });
            addToast(newStatus ? 'Destacado' : 'No destacado', 'success');
        } catch (e) { fetchProducts(page); addToast('Error', 'error'); }
    };

    return (
        <div className="space-y-4">
            {/* BARRA DE FILTROS ESTILO LIMPIO (Tu Imagen) */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-3">

                {/* Buscador */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-gray-400"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:border-primary outline-none cursor-pointer hover:border-gray-300">
                        <option value="">Todas las Categorías</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>

                    <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:border-primary outline-none cursor-pointer hover:border-gray-300">
                        <option value="">Todas las Marcas</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>

                    <button
                        onClick={() => setShowLowStock(!showLowStock)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-colors border flex items-center gap-2 ${showLowStock ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        ⚠️ Stock Bajo
                    </button>

                    {/* Botón Nuevo (Azul Oscuro como en la imagen) */}
                    <button onClick={() => navigate('/admin/nuevo')} className="bg-[#111827] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gray-800 shadow-md whitespace-nowrap flex items-center gap-2 ml-2">
                        <span>+</span> Nuevo
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto relative min-h-[300px]">
                    {isLoading && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}

                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50"><tr><th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Producto</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Precio</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Stock</th><th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">#{p.id}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 max-w-[250px] truncate" title={p.nombre}>{p.nombre}</td>
                                    <td className="px-6 py-4 text-sm"><span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">{p.categoria?.nombre}</span></td>
                                    <td className="px-6 py-4 text-sm font-mono">
                                        <div className="flex flex-col">{p.precioOriginal ? <><span className="text-red-600 font-bold">${Number(p.precio).toLocaleString('es-AR')}</span><span className="text-xs text-gray-400 line-through font-medium">${Number(p.precioOriginal).toLocaleString('es-AR')}</span></> : <span className="text-gray-700 font-bold">${Number(p.precio).toLocaleString('es-AR')}</span>}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-md font-bold text-xs ${p.stock > 90000 ? 'bg-blue-50 text-blue-600' : p.stock <= 5 ? 'bg-red-50 text-red-600 animate-pulse' : 'text-green-700 bg-green-50'}`}>{p.stock > 90000 ? '∞' : p.stock}</span></td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        {/* Botones SIEMPRE visibles */}
                                        <div className="flex justify-end gap-1">
                                            <button data-testid="btn-feature" onClick={() => handleToggleFeatured(p)} className={`p-1.5 rounded-lg transition-colors ${p.isFeatured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'}`} title="Destacar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg></button>
                                            <button data-testid="btn-discount" onClick={() => setProductToDiscount(p)} className={`p-1.5 rounded-lg transition-colors ${p.precioOriginal ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`} title="Oferta"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg></button>
                                            <button data-testid="btn-stock" onClick={() => setProductToUpdateStock(p)} className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="Stock"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></button>
                                            <button onClick={() => navigate(`/admin/editar/${p.id}`)} className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
                                            <button data-testid="btn-delete" onClick={() => setProductToDelete(p)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div><p className="text-sm text-gray-500">Página <span className="font-bold text-gray-800">{page}</span> de <span className="font-bold text-gray-800">{totalPages}</span></p></div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button onClick={handlePrevPage} disabled={page === 1} className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                                <button onClick={handleNextPage} disabled={page === totalPages} className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <ConfirmModal isOpen={!!productToDelete} title="Eliminar" message="¿Seguro que deseas eliminar este producto?" confirmText="Sí, eliminar" isDanger={true} onConfirm={handleDelete} onCancel={() => setProductToDelete(null)} />
            <UpdateStockModal isOpen={!!productToUpdateStock} productName={productToUpdateStock?.nombre || ''} currentStock={productToUpdateStock?.stock || 0} onConfirm={handleStockUpdate} onCancel={() => setProductToUpdateStock(null)} />
            <DiscountModal isOpen={!!productToDiscount} product={productToDiscount} onConfirm={handleDiscountUpdate} onCancel={() => setProductToDiscount(null)} />
        </div>
    );
}

export default function ProductListTable() {
    return (
        <ErrorBoundary fallback={<div className="p-4 text-red-500 border border-red-200 rounded">Error cargando productos.</div>}>
            <ProductListContent />
        </ErrorBoundary>
    );
}