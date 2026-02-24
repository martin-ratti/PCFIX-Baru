import { create } from 'zustand';
import { API_URL } from '../utils/api';
import type { ServiceItem } from '../types/config';


export type { ServiceItem };

interface ServiceState {
  items: ServiceItem[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  updateItem: (id: number, data: Partial<ServiceItem>) => void;
}

export const useServiceStore = create<ServiceState>((set) => ({
  items: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/technical/prices`);

      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

      const json = await res.json();

      if (json.success) {
        set({ items: json.data });
      }
    } catch (error) {

    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: (id, data) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...data } : item
    )
  })),
}));