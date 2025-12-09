import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';

export default defineConfig({
  site: 'https://pcfixbaru.com.ar',
  output: 'server',
  adapter: node({
    mode: 'standalone'
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
        ];
        return !excludePatterns.some(pattern => page.includes(pattern));
      }
    }),
    ...(process.env.PUBLIC_SENTRY_DSN ? [sentry({
      dsn: process.env.PUBLIC_SENTRY_DSN,
      sourceMapsUploadOptions: {
        enabled: false, // Disable source map uploads for now
      },
    })] : [])
  ],
  image: {
    domains: [
      'placehold.co',
      'images.unsplash.com',
      'res.cloudinary.com'
    ],
    remotePatterns: [{ protocol: "https" }],
  },
});