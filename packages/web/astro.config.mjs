import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react(), tailwind()],
  image: {
    domains: [
      'placehold.co',
      'images.unsplash.com',
      'res.cloudinary.com'
    ],
    remotePatterns: [{ protocol: "https" }],
  },
});