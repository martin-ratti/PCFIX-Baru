import { useState, useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import { useToastStore } from '../../../stores/toastStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import UpdateStockModal from './UpdateStockModal';
import DiscountModal from './DiscountModal';
import { fetchApi } from '../../../utils/api';
import ErrorBoundary from '../../ui/feedback/ErrorBoundary';
import { SearchIcon, AlertTriangleIcon, PlusIcon, StarIcon, TagIcon, RefreshCwIcon, EditIcon, Trash2Icon } from '../../SharedIcons'; 

interface Product { id: number; nombre: string; precio: string; precioOriginal?: string | null; stock: number; isFeatured: boolean; categoria: { nombre: string }; }
interface Category { id: number; nombre: string; }
interface Brand { id: number; nombre: string; }

function ProductListContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]); 

    
    const [filterCat, setFilterCat] = useState<string>('');
    const [filterBrand, setFilterBrand] = useState<string>('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [productToUpdateStock, setProductToUpdateStock] = useState<Product | null>(null);
    const [productToDiscount, setProductToDiscount] = useState<Product | null>(null);

    const addToast = useToastStore(s => s.addToast);

    
    useEffect(() => {
        fetchApi('/categories').then(res => res.json()).then(d => d.success && setCategories(d.data));
        fetchApi('/brands').then(res => res.json()).then(d => d.success && setBrands(d.data));

        
        const params = new URLSearchParams(window.location.search);
        if (params.get('filter') === 'lowStock') {
            setShowLowStock(true);
        }
        if (params.get('search')) {
            setSearchTerm(params.get('search') || '');
        }
    }, []);

    
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
            
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-3">

                
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
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
                        className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 border flex items-center gap-2 ${showLowStock ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <AlertTriangleIcon className="w-4 h-4" /> Stock Bajo
                    </button>

                    <button onClick={() => navigate('/admin/nuevo')} className="bg-[#111827] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gray-800 shadow-md whitespace-nowrap flex items-center gap-2 ml-2 transition-all active:scale-95">
                        <PlusIcon className="w-4 h-4" /> Nuevo
                    </button>
                </div>
            </div>

            
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
                                    <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-md font-bold text-xs ${p.categoria?.nombre?.toLowerCase().includes('servicio') ? 'bg-blue-50 text-blue-600' : p.stock <= 5 ? 'bg-red-50 text-red-600 animate-pulse' : 'text-green-700 bg-green-50'}`}>{p.categoria?.nombre?.toLowerCase().includes('servicio') ? '∞' : p.stock}</span></td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        
                                        <div className="flex justify-end gap-1">
                                            <button data-testid="btn-feature" onClick={() => handleToggleFeatured(p)} className={`p-1.5 rounded-lg transition-all active:scale-90 ${p.isFeatured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'}`} title="Destacar"><StarIcon className={`w-5 h-5 ${p.isFeatured ? 'fill-current' : ''}`} /></button>
                                            <button data-testid="btn-discount" onClick={() => setProductToDiscount(p)} className={`p-1.5 rounded-lg transition-all active:scale-90 ${p.precioOriginal ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`} title="Oferta"><TagIcon className="w-5 h-5" /></button>
                                            <button data-testid="btn-stock" onClick={() => setProductToUpdateStock(p)} className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded-lg transition-all active:scale-90" title="Stock"><RefreshCwIcon className="w-5 h-5" /></button>
                                            <button onClick={() => navigate(`/admin/editar/${p.id}`)} className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-all active:scale-90" title="Editar"><EditIcon className="w-5 h-5" /></button>
                                            <button data-testid="btn-delete" onClick={() => setProductToDelete(p)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all active:scale-90" title="Eliminar"><Trash2Icon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div><p className="text-sm text-gray-500">Página <span className="font-bold text-gray-800">{page}</span> de <span className="font-bold text-gray-800">{totalPages}</span></p></div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button onClick={handlePrevPage} disabled={page === 1} className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">Anterior</button>
                                <button onClick={handleNextPage} disabled={page === totalPages} className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">Siguiente</button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            
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