import { create } from 'zustand';

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

    // 1. Optimistic Update
    if (isCurrentlyFavorite) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }

    // 2. Debounced API Call
    // We use a simple strategy: Clear existing timeout for this product if any, then set new one.
    // However, for simplicity and to match requirements, we'll just fire the request.
    // The requirement says "implement debounce of 500ms".
    // We need to track timeouts outside the store state or in a ref-like structure if we were in React,
    // but in Zustand we can store them in a non-reactive property or just let the chaos reign?
    // No, let's use a module-level variable for timeouts since Zustand stores are singletons.

    const DEBOUNCE_MS = 500;

    if (favoriteTimeouts[productId]) {
      clearTimeout(favoriteTimeouts[productId]);
    }

    favoriteTimeouts[productId] = setTimeout(async () => {
      try {
        await fetch(`http://localhost:3002/api/favorites/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId, state: !isCurrentlyFavorite })
        });
        delete favoriteTimeouts[productId];
      } catch (error) {
        // 3. Rollback on Error
        set({ favoriteIds: previousIds });
        // Ideally we'd show a toast here, but the store shouldn't probably trigger UI side effects directly 
        // coupled to valid stores. But we can import the toast store.
        import('./toastStore').then(mod => mod.useToastStore.getState().addToast("Error al guardar favorito", 'error'));
      }
    }, DEBOUNCE_MS);
  },

  fetchFavorites: async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:3002/api/favorites/${userId}`);
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

// Module-level Record for timeouts to handle debouncing per product
const favoriteTimeouts: Record<number, NodeJS.Timeout> = {};