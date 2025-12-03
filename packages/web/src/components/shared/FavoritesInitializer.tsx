import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useFavoritesStore } from '../../stores/favoritesStore';

export default function FavoritesInitializer() {
  const { user, isAuthenticated } = useAuthStore();
  const { fetchFavorites, setFavorites } = useFavoritesStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Si hay usuario, cargamos sus favoritos
      fetchFavorites(user.id);
    } else {
      // Si se desloguea, limpiamos
      setFavorites([]);
    }
  }, [isAuthenticated, user?.id]);

  return null; // Este componente no renderiza nada visual
}