import React from 'react';
import { useCartStore } from '../stores/cartStore';

export default function CartView() {
  const { items, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-secondary mb-4">Tu carrito está vacío</h1>
        <p className="text-muted mb-8">Parece que aún no has agregado productos.</p>
        <a href="/" className="bg-primary text-light font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors">
          Ir a la tienda
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna de Items */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-secondary mb-6">Tu Carrito</h1>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center bg-white p-4 rounded-lg shadow-md gap-4">
              <img src={item.imageUrl} alt={item.imageAlt} className="w-24 h-24 object-cover rounded" />
              <div className="flex-grow">
                <h2 className="font-bold text-lg">{item.name}</h2>
                <p className="text-primary font-semibold">${item.price.toLocaleString('es-AR')}</p>
              </div>
              <div className="flex items-center border border-muted rounded-lg">
                <button onClick={() => decreaseQuantity(item.id)} className="px-3 py-1 hover:bg-gray-200">-</button>
                <span className="px-4 py-1">{item.quantity}</span>
                <button onClick={() => increaseQuantity(item.id)} className="px-3 py-1 hover:bg-gray-200">+</button>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-muted hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Columna de Resumen */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
          <h2 className="text-2xl font-bold text-secondary border-b pb-4 mb-4">Resumen de Compra</h2>
          <div className="flex justify-between mb-4">
            <span className="text-muted">Subtotal</span>
            <span className="font-bold">${subtotal.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t pt-4 mt-4">
            <span>Total</span>
            <span>${subtotal.toLocaleString('es-AR')}</span>
          </div>
          <button className="w-full mt-6 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors">
            Finalizar Compra
          </button>
          <button onClick={clearCart} className="w-full mt-2 text-sm text-red-500 hover:underline">
            Vaciar Carrito
          </button>
        </div>
      </div>
    </div>
  );
}