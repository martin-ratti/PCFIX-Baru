import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function PublicLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role === 'ADMIN') return null;

  return (
    <a href="/nosotros" className="text-secondary hover:text-primary transition-colors font-medium whitespace-nowrap">
      Nosotros
    </a>
  );
}