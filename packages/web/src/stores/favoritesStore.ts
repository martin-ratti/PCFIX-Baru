import { create } from 'zustand';

interface FavoritesState {
  favoriteIds: number[];
  setFavorites: (ids: number[]) => void;
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  fetchFavorites: (userId: number) => Promise<void>;
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

  fetchFavorites: async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:3002/api/favorites/${userId}`);
      const json = await res.json();
      if (json.success) {
        const ids = json.data.map((p: any) => p.id);
        set({ favoriteIds: ids });
      }
    } catch (error) {

    }
  }
}));