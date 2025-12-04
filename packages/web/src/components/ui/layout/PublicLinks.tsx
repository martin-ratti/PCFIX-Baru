import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function PublicLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  // Si es Admin, no mostramos estos links
  if (!isClient || user?.role === 'ADMIN') return null;

  return (
    <div className="flex items-center gap-6">
      <a href="/nosotros" className="text-secondary hover:text-primary transition-colors font-medium whitespace-nowrap">
        Nosotros
      </a>
      <a href="/servicios" className="text-secondary hover:text-primary transition-colors font-medium whitespace-nowrap flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-1.071 1.97-1.743.14-1.743-2.45-5.569-1.875-9.36 2.92-4.11 5.202-1.267 8.474 1.267 8.474 2.534 0 5.806-2.843 2.92-9.36.19-.672 1.084-1.834.14-1.743z" />
        </svg>
        Servicio Técnico
      </a>
    </div>
  );
}