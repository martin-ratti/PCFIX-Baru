import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function PublicLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role === 'ADMIN') return null;

  const linkClass = "flex items-center gap-1 text-secondary hover:text-primary transition-colors py-2 font-medium group";

  return (
    <div className="flex items-center gap-6">
      <a href="/nosotros" className={linkClass}>
        Nosotros
      </a>
      
      <a href="/servicios" className={linkClass}>
        {/* ICONO SEGURO (Wrench/Screwdriver) */}
        <div className="p-1 rounded-md group-hover:bg-primary/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634Zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866Zm2.023 6.828a.75.75 0 1 0-1.06-1.06 3.75 3.75 0 0 1-5.304 0 .75.75 0 0 0-1.06 1.06 5.25 5.25 0 0 0 7.424 0Z" clipRule="evenodd" />
            </svg>
        </div>
        <span>Servicio Técnico</span>
      </a>
    </div>
  );
}