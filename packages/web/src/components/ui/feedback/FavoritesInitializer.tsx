import { useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useFavoritesStore } from '../../../stores/favoritesStore';

export default function FavoritesInitializer() {
  const { user, isAuthenticated } = useAuthStore();
  const { fetchFavorites, setFavorites } = useFavoritesStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      
      fetchFavorites(user.id);
    } else {
      
      setFavorites([]);
    }
  }, [isAuthenticated, user?.id]);

  return null; 
}