import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '../data/mock-data';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) => set((state) => {
        const existingItem = state.items.find((item) => item.id === product.id);
        if (existingItem) {
          const updatedItems = state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
          return { items: updatedItems };
        } else {
          return { items: [...state.items, { ...product, quantity: 1 }] };
        }
      }),
      removeItem: (productId) => set((state) => ({
        items: state.items.filter((item) => item.id !== productId),
      })),
      increaseQuantity: (productId) => set((state) => ({
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity: Math.min(item.stock, item.quantity + 1) } : item
        ),
      })),
      decreaseQuantity: (productId) => set((state) => ({
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
        ),
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-session-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);