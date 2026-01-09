import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
// 1. CAMBIO: Usamos el adaptador de Vercel en lugar de Node
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://pcfixbaru.com.ar', // Tu dominio final o el de Vercel
  output: 'server',

  // 2. CAMBIO: Configuración específica para Vercel Serverless
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true, // Habilita optimización de imágenes de Vercel
  }),

  integrations: [
    react(),
    tailwind(),
    sitemap({
      filter: (page) => {
        // Exclude private/admin routes from sitemap
        const excludePatterns = [
          '/admin',
          '/auth',
          '/checkout',
          '/perfil',
          '/mis-consultas',
          '/404',
          '/success'
        ];
        return !excludePatterns.some(pattern => page.includes(pattern));
      }
    }),
    // Configuración condicional de Sentry
    ...(process.env.PUBLIC_SENTRY_DSN ? [sentry({
      dsn: process.env.PUBLIC_SENTRY_DSN,
      sourceMapsUploadOptions: {
        enabled: false,
      },
    })] : [])
  ],

  // Configuración de imágenes remotas
  image: {
    domains: [
      'placehold.co',
      'images.unsplash.com',
      'res.cloudinary.com' // Importante para tus productos
    ],
    remotePatterns: [{ protocol: "https" }],
  },
});