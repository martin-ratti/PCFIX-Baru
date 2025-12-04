import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // Optimización de velocidad
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  image: {
    // IMPORTANTE: Autorizar dominios externos
    domains: ['images.unsplash.com', 'res.cloudinary.com'], 
  },
  integrations: [react(), tailwind()]
});