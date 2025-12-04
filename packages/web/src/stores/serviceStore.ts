import { create } from 'zustand';

export interface ServiceItem {
  id: number;
  title: string;
  price: number;
  description: string;
}

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
      console.log("🔄 Fetching services..."); // DEBUG

      // 1. Usamos 127.0.0.1 y puerto 3002 explícitamente
      // 2. La ruta debe coincidir con lo que pusimos en server.ts (/api/technical/prices)
      const res = await fetch('http://127.0.0.1:3002/api/technical/prices');
      
      console.log("📡 Status:", res.status); // DEBUG

      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

      const json = await res.json();
      console.log("📦 Data recibida:", json); // DEBUG

      if (json.success) {
        set({ items: json.data });
      } else {
        console.error("❌ API devolvió success: false", json.error);
      }
    } catch (error) {
      console.error('❌ Error fatal fetching services:', error);
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