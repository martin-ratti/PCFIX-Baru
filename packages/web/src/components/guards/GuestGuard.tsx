import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {

      return !!localStorage.getItem('auth-storage');
    }
    return true;
  });

  useEffect(() => {

    if (isAuthenticated && user) {
      const target = user.role === 'ADMIN' ? '/admin' : '/';
      setTimeout(() => {

        window.location.replace(target);
      }, 500);

    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading) {

    return <div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div></div>;
  }

  return <>{children}</>;
}