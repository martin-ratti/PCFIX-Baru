import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useServiceStore, type ServiceItem } from '../../../stores/serviceStore';
import { useToastStore } from '../../../stores/toastStore';
import { fetchApi } from '../../../utils/api';

interface Props {
  children?: React.ReactNode;
}

export default function ServicePriceModal({ children }: Props) {
  const { user, token } = useAuthStore(); // Get token here
  const { items, fetchItems } = useServiceStore();
  const addToast = useToastStore(s => s.addToast);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editValues, setEditValues] = useState<ServiceItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchItems().then(() => {
        setTimeout(() => {
          const currentItems = useServiceStore.getState().items;
          setEditValues([...currentItems]);
        }, 50);
      });
    }
  }, [isOpen]);

  if (!user || user.role !== 'ADMIN') return null;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    let errorCount = 0;
    let successCount = 0;

    try {
      const promises = editValues.map(async (item) => {
        const original = items.find((i) => i.id === item.id);
        if (original && original.price !== item.price) {
          // 👇 FIX: Add Authorization header
          const res = await fetchApi(`/technical/prices/${item.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ price: Number(item.price) })
          });
          if (!res.ok) { errorCount++; throw new Error(); } else { successCount++; }
        }
      });

      await Promise.all(promises);

      if (errorCount === 0 && successCount > 0) {
        addToast('Tarifas actualizadas', 'success');
        setIsOpen(false);
        await fetchItems();
      } else if (successCount === 0 && errorCount === 0) {
        setIsOpen(false);
      } else {
        addToast('Error al actualizar algunos precios', 'error');
      }
    } catch { addToast('Error de conexión o permisos', 'error'); }
    finally { setLoading(false); }
  };

  const handleChange = (id: number, val: string) => {
    const numVal = val === '' ? 0 : parseInt(val);
    setEditValues(prev => prev.map(p => p.id === id ? { ...p, price: isNaN(numVal) ? 0 : numVal } : p));
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children || (
          <button className="px-3 py-1 bg-gray-200 text-xs font-bold rounded">Tarifas</button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in cursor-default">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-modal-enter" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 leading-tight">Precios de Servicios</h3>
                  <p className="text-xs text-gray-500">Actualiza las tarifas del taller</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">&times;</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              {editValues.map((item) => {
                const isModified = item.price !== items.find(i => i.id === item.id)?.price;
                return (
                  <div key={item.id} className={`group transition-all ${isModified ? 'bg-yellow-50/50 -mx-2 px-2 py-2 rounded-lg border border-yellow-100' : ''}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.title}</label>
                      {isModified && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-bold shadow-sm">Modificado</span>}
                    </div>
                    <div className="relative group-focus-within:scale-[1.01] transition-transform">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold select-none">$</span>
                      <input type="number" value={item.price} onChange={(e) => handleChange(item.id, e.target.value)} className={`w-full pl-7 pr-3 py-3 bg-gray-50 border rounded-xl focus:ring-2 outline-none font-mono text-lg font-bold text-gray-800 transition-all ${isModified ? 'border-yellow-300 focus:ring-yellow-200 bg-white' : 'border-gray-200 focus:ring-primary/20 focus:border-primary focus:bg-white'}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} type="button" className="flex-1 px-4 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={loading} type="button" className="flex-1 px-4 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Guardando...</span></> : <><span>Guardar Cambios</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}