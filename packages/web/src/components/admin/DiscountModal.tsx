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

  // Precio base: Si ya tiene descuento, usamos el original. Si no, el actual.
  const basePrice = product ? (Number(product.precioOriginal) || Number(product.precio)) : 0;

  useEffect(() => {
    if (isOpen && product) {
      setValue('');
      setMode('percent');
      setCalculatedPrice(Number(product.precio));
    }
  }, [isOpen, product]);

  // Recalcular cuando cambia el input
  useEffect(() => {
    const val = parseFloat(value) || 0;
    if (mode === 'percent') {
      // Descuento porcentual (ej. 10%)
      const discountAmount = basePrice * (val / 100);
      setCalculatedPrice(Math.max(0, basePrice - discountAmount));
    } else {
      // Precio fijo directo
      setCalculatedPrice(val);
    }
  }, [value, mode, basePrice]);

  const handleSubmit = () => {
    if (calculatedPrice >= basePrice) {
      // Si el precio nuevo es mayor o igual al base, quitamos la oferta
      onConfirm(basePrice, null);
    } else {
      // Aplicamos oferta: Guardamos el precio base como "original" y el calculado como "precio"
      onConfirm(calculatedPrice, basePrice);
    }
  };

  const handleRemove = () => {
    // Restaurar precio original
    onConfirm(basePrice, null);
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-purple-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-purple-900">Aplicar Descuento</h3>
            <p className="text-xs text-purple-700 truncate max-w-[200px]">{product.nombre}</p>
          </div>
          <span className="text-2xl">🏷️</span>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Selector de Modo */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => { setMode('percent'); setValue(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'percent' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Porcentaje (%)
            </button>
            <button
              onClick={() => { setMode('fixed'); setValue(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'fixed' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Precio Fijo ($)
            </button>
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              {mode === 'percent' ? 'Porcentaje de Descuento' : 'Nuevo Precio Final'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={mode === 'percent' ? 'Ej: 20' : 'Ej: 15000'}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                autoFocus
              />
              {mode === 'percent' && <span className="absolute right-4 top-3.5 text-gray-400 font-bold">%</span>}
            </div>
          </div>

          {/* Preview de Resultados */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Precio Regular:</span>
              <span className="font-medium line-through text-gray-400">${basePrice.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-sm font-bold text-secondary">Precio Oferta:</span>
              <span className="text-2xl font-black text-purple-600">${calculatedPrice.toLocaleString('es-AR')}</span>
            </div>
            {mode === 'percent' && value && (
              <div className="mt-2 text-center">
                <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">
                  Ahorras: ${(basePrice - calculatedPrice).toLocaleString('es-AR')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-between gap-3">
          {product.precioOriginal ? (
             <button onClick={handleRemove} className="text-red-500 text-sm font-bold hover:underline">Quitar Oferta</button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                Cancelar
            </button>
            <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-md transition-colors">
                Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}