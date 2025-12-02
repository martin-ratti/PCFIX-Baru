import React, { useState, useEffect } from 'react';

interface UpdateStockModalProps {
  isOpen: boolean;
  productName: string;
  currentStock: number;
  onConfirm: (newStock: number) => void;
  onCancel: () => void;
}

export default function UpdateStockModal({
  isOpen,
  productName,
  currentStock,
  onConfirm,
  onCancel,
}: UpdateStockModalProps) {
  const [stock, setStock] = useState(currentStock);

  // Sincronizar el estado cuando se abre el modal con un nuevo producto
  useEffect(() => {
    setStock(currentStock);
  }, [currentStock, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-primary">Ajustar Stock</h3>
          <p className="text-xs text-muted truncate">{productName}</p>
        </div>

        <div className="px-6 py-8">
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setStock(Math.max(0, stock - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xl flex items-center justify-center transition-colors"
            >
              -
            </button>
            
            <input 
              type="number" 
              value={stock}
              onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 text-center text-2xl font-bold text-primary border-b-2 border-gray-200 focus:border-primary focus:outline-none py-1"
            />

            <button 
              onClick={() => setStock(stock + 1)}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xl flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(stock)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 transition-colors shadow-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}