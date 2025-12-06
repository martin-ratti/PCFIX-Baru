import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import { fetchApi } from '../../../utils/api';

export default function ManualSaleForm() {
  const { token } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const { register, handleSubmit, reset } = useForm({
      defaultValues: {
          customerEmail: 'mostrador@pcfix.com',
          medioPago: 'EFECTIVO',
          estado: 'ENTREGADO'
      }
  });

  // 👇 LÓGICA DE BÚSQUEDA MEJORADA
  // Carga inicial + Búsqueda en vivo
  useEffect(() => {
    const timer = setTimeout(() => {
        // Si está vacío, traemos los primeros 20 (incluye servicios)
        // Si hay texto, buscamos específicamente
        const query = searchTerm.length >= 2 ? `search=${encodeURIComponent(searchTerm)}&limit=20` : `limit=20`;
        
        fetchApi(`/products?${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) setSearchResults(data.data);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, token]); // Se ejecuta al inicio (searchTerm='') y al escribir

  const addToCart = (product: any) => {
      setCart(prev => {
          const existing = prev.find((i: any) => i.id === product.id);
          if (existing) {
              // Validar stock solo si es producto físico
              if (product.stock < 90000 && existing.quantity >= product.stock) {
                  addToast('No hay más stock disponible', 'error');
                  return prev;
              }
              return prev.map((i: any) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { ...product, quantity: 1 }];
      });
      // No limpiamos el término para permitir agregar varios ítems rápido
  };

  const removeFromCart = (id: number) => {
      setCart(prev => prev.filter((i: any) => i.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
      setCart(prev => prev.map((item: any) => {
          if (item.id === id) {
              const newQty = item.quantity + delta;
              if (newQty < 1) return item;
              if (item.stock < 90000 && newQty > item.stock) {
                  addToast('Stock insuficiente', 'error');
                  return item;
              }
              return { ...item, quantity: newQty };
          }
          return item;
      }));
  };

  const total = cart.reduce((acc, item) => acc + (Number(item.precio) * item.quantity), 0);

  const onPreSubmit = (data: any) => {
      if (cart.length === 0) {
          addToast("El carrito está vacío", 'error');
          return;
      }
      setPendingData(data);
      setIsConfirmOpen(true);
  };

  const handleConfirmSale = async () => {
      if (!pendingData) return;
      setIsLoading(true);
      setIsConfirmOpen(false);

      try {
          const res = await fetchApi('/sales/manual', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  customerEmail: pendingData.customerEmail,
                  items: cart.map((i: any) => ({ id: i.id, quantity: i.quantity })),
                  medioPago: pendingData.medioPago,
                  estado: pendingData.estado
              })
          });
          
          const json = await res.json();
          
          if (json.success) {
              addToast("Venta registrada correctamente", 'success');
              setCart([]);
              reset();
          } else {
              throw new Error(json.error);
          }
      } catch (e: any) {
          addToast(e.message || "Error al crear venta", 'error');
      } finally {
          setIsLoading(false);
          setPendingData(null);
      }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px] animate-fade-in">
        
        {/* COLUMNA 1: CATÁLOGO */}
        <div className="lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 z-20 relative">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar producto o servicio (Ej: 'Limpieza', 'Ryzen')..." 
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
            
            {/* Resultados Flotantes */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {searchResults.map(product => (
                            <div 
                                key={product.id} 
                                onClick={() => addToCart(product)} 
                                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all group flex flex-col active:scale-95"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img src={product.foto || "https://placehold.co/100x100?text=IMG"} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-primary font-mono bg-blue-50 px-2 py-1 rounded text-xs">
                                        ${Number(product.precio).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                <p className="font-bold text-sm text-gray-800 line-clamp-2 mb-1">{product.nombre}</p>
                                <p className="text-xs text-gray-500 mt-auto flex justify-between">
                                    <span className="truncate max-w-[60%]">{product.categoria?.nombre || 'General'}</span>
                                    <span className={product.stock > 90000 ? 'text-blue-500 font-bold' : ''}>
                                        {product.stock > 90000 ? 'Servicio' : `Stock: ${product.stock}`}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        {searchTerm ? (
                            <p>No se encontraron resultados.</p>
                        ) : (
                            <div className="animate-pulse">Cargando catálogo...</div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* COLUMNA 2: TICKET */}
        <div className="lg:w-1/3 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-5 bg-gray-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Ticket de Venta</h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{cart.reduce((a: any, b: any) => a + b.quantity, 0)} ítems</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <span className="text-6xl mb-2">🧾</span>
                        <p>Carrito vacío</p>
                    </div>
                ) : (
                    cart.map((item: any) => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group">
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="text-sm font-bold text-gray-800 truncate">{item.nombre}</p>
                                <p className="text-xs text-gray-500">${Number(item.precio).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-gray-600 font-bold">-</button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-green-600 font-bold">+</button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="ml-2 text-red-400 hover:text-red-600 p-1">
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-5 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 font-medium">Total a Cobrar</span>
                    <span className="text-3xl font-black text-primary">${total.toLocaleString('es-AR')}</span>
                </div>

                <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Cliente</label>
                        <input {...register('customerEmail')} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pago</label>
                            <select {...register('medioPago')} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary cursor-pointer">
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="BINANCE">Binance</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Estado</label>
                            <select {...register('estado')} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary cursor-pointer">
                                <option value="ENTREGADO">Entregado</option>
                                <option value="APROBADO">Pend. Retiro</option>
                                <option value="PENDIENTE_PAGO">Pend. Pago</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={cart.length === 0 || isLoading}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isLoading ? 'Procesando...' : '✅ Finalizar Venta'}
                    </button>
                </form>
            </div>
        </div>

        <ConfirmModal 
            isOpen={isConfirmOpen}
            title="Confirmar Venta Manual"
            message={`¿Registrar venta por $${total.toLocaleString('es-AR')} con medio de pago ${pendingData?.medioPago}? Esto descontará stock inmediatamente.`}
            confirmText="Sí, Registrar"
            cancelText="Revisar"
            onConfirm={handleConfirmSale}
            onCancel={() => setIsConfirmOpen(false)}
        />
    </div>
  );
}