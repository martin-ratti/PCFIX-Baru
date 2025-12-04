import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useServiceStore, type ServiceItem } from '../../../stores/serviceStore';
import { toast } from 'sonner';

export default function ServicePriceModal() {
  const { user, token } = useAuthStore();
  const { items, fetchItems, updateItem } = useServiceStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editValues, setEditValues] = useState<ServiceItem[]>([]);

  // 1. Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      console.log("⚡ Modal Abierto. Cargando...");
      fetchItems().then(() => {
        setTimeout(() => {
            const currentItems = useServiceStore.getState().items;
            setEditValues([...currentItems]); 
        }, 100);
      });
    }
  }, [isOpen]);

  if (!user || user.role !== 'ADMIN') return null;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    let errorCount = 0;

    try {
      const promises = editValues.map(async (item) => {
        const original = items.find((i) => i.id === item.id);
        if (original && original.price !== item.price) {
            const res = await fetch(`http://127.0.0.1:3002/api/technical/prices/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ price: Number(item.price) })
            });

            if (!res.ok) {
                errorCount++;
                throw new Error('Error saving');
            }
            updateItem(item.id, { price: Number(item.price) });
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
          toast.success('Tarifas actualizadas correctamente');
          setIsOpen(false);
          fetchItems();
      } else {
          toast.warning('Algunas tarifas no se pudieron actualizar');
      }
    } catch (error) {
      console.error("🔥 Error general:", error);
      toast.error('Error de conexión al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: number, val: string) => {
    const numVal = parseInt(val) || 0;
    setEditValues(prev => prev.map(p => p.id === id ? { ...p, price: numVal } : p));
  };

  return (
    <>
      {/* BOTÓN TRIGGER (Texto actualizado a "Actualizar tarifas") */}
      <button 
        onClick={() => setIsOpen(true)}
        className="
            flex items-center gap-2 
            px-5 py-2.5 h-10
            bg-gray-900 hover:bg-gray-800 
            text-white text-sm font-bold 
            rounded-full
            shadow-lg shadow-gray-900/20
            transform active:scale-95 hover:scale-105 transition-all duration-200
            whitespace-nowrap
        "
        title="Editar precios de servicios técnicos"
      >
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-yellow-400"
        >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        
        {/* TEXTO CAMBIADO */}
        <span>Actualizar tarifas</span>
      </button>

      {/* --- MODAL --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">Gestión de Tarifas</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">✕</button>
            </div>
            
            <form className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {editValues.map((item) => (
                    <div key={item.id} className="group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.title}</label>
                            {item.price !== items.find(i => i.id === item.id)?.price && (
                                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">Modificado</span>
                            )}
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input 
                                type="number" 
                                value={item.price}
                                onChange={(e) => handleChange(item.id, e.target.value)}
                                className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none font-mono text-lg font-bold text-gray-800 transition-all"
                            />
                        </div>
                    </div>
                ))}
                {editValues.length === 0 && <p className="text-center text-gray-400 text-sm">Cargando datos...</p>}
            </form>

            <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                <button onClick={() => setIsOpen(false)} type="button" className="flex-1 px-4 py-2.5 text-gray-600 font-bold hover:bg-gray-200/50 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={loading} type="button" className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}