import { create } from 'zustand';
import { API_URL } from '../utils/api';

interface FavoritesState {
  favoriteIds: number[];
  setFavorites: (ids: number[]) => void;
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  fetchFavorites: (userId: number) => Promise<void>;
  toggleFavoriteOptimistic: (userId: number, productId: number) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: [],

  setFavorites: (ids) => set({ favoriteIds: ids }),

  addFavorite: (id) => set((state) => ({
    favoriteIds: [...state.favoriteIds, id]
  })),

  removeFavorite: (id) => set((state) => ({
    favoriteIds: state.favoriteIds.filter((fid) => fid !== id)
  })),

  isFavorite: (id) => get().favoriteIds.includes(id),

  toggleFavoriteOptimistic: async (userId: number, productId: number) => {
    const { favoriteIds, addFavorite, removeFavorite } = get();
    const isCurrentlyFavorite = favoriteIds.includes(productId);
    const previousIds = [...favoriteIds];

    
    if (isCurrentlyFavorite) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }

    
    
    
    
    
    
    

    const DEBOUNCE_MS = 500;

    if (favoriteTimeouts[productId]) {
      clearTimeout(favoriteTimeouts[productId]);
    }

    favoriteTimeouts[productId] = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/favorites/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId, state: !isCurrentlyFavorite })
        });
        delete favoriteTimeouts[productId];
      } catch (error) {
        
        set({ favoriteIds: previousIds });
        
        
        import('./toastStore').then(mod => mod.useToastStore.getState().addToast("Error al guardar favorito", 'error'));
      }
    }, DEBOUNCE_MS);
  },

  fetchFavorites: async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/favorites/${userId}`);
      const json = await res.json();
      if (json.success) {
        const ids = json.data.map((p: any) => p.id);
        set({ favoriteIds: ids });
      }
    } catch (error) {
      console.error("Failed to fetch favorites", error);
    }
  }
}));


const favoriteTimeouts: Record<number, NodeJS.Timeout> = {};