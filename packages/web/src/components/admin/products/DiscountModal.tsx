import React, { useState, useEffect } from 'react';

interface DiscountModalProps {
  isOpen: boolean;
  product: { id: number; nombre: string; precio: string; precioOriginal?: string | null } | null;
  onConfirm: (newPrice: number, originalPrice: number | null) => void;
  onCancel: () => void;
}

export default function DiscountModal({ isOpen, product, onConfirm, onCancel }: DiscountModalProps) {
  const [mode, setMode] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState<string>('');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  const basePrice = product ? (Number(product.precioOriginal) || Number(product.precio)) : 0;

  useEffect(() => {
    if (isOpen && product) {
      setValue('');
      setMode('percent');
      setCalculatedPrice(Number(product.precio));
    }
  }, [isOpen, product]);

  useEffect(() => {
    const val = parseFloat(value) || 0;
    if (mode === 'percent') {
      const discountAmount = basePrice * (val / 100);
      setCalculatedPrice(Math.max(0, basePrice - discountAmount));
    } else {
      setCalculatedPrice(val);
    }
  }, [value, mode, basePrice]);

  const handleSubmit = () => {
    if (calculatedPrice >= basePrice) {
      onConfirm(basePrice, null); // Quitar oferta
    } else {
      onConfirm(calculatedPrice, basePrice); // Aplicar oferta
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-modal-enter">
        <div className="px-6 py-4 border-b border-gray-100 bg-purple-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-purple-900">Aplicar Descuento</h3>
            <p className="text-xs text-purple-700 truncate max-w-[200px]">{product.nombre}</p>
          </div>
          <span className="text-2xl">🏷️</span>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => { setMode('percent'); setValue(''); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all active:scale-95 ${mode === 'percent' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Porcentaje (%)</button>
            <button onClick={() => { setMode('fixed'); setValue(''); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all active:scale-95 ${mode === 'fixed' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Precio Fijo ($)</button>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{mode === 'percent' ? 'Porcentaje' : 'Nuevo Precio'}</label>
            <div className="relative">
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === 'percent' ? 'Ej: 20' : 'Ej: 15000'} className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" autoFocus />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2"><span className="text-sm text-gray-500">Regular:</span><span className="font-medium line-through text-gray-400">${basePrice.toLocaleString('es-AR')}</span></div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2"><span className="text-sm font-bold text-secondary">Oferta:</span><span className="text-2xl font-black text-purple-600">${calculatedPrice.toLocaleString('es-AR')}</span></div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-all active:scale-95">Cancelar</button>
          <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-all active:scale-95">Aplicar</button>
        </div>
      </div>
    </div>
  );
}