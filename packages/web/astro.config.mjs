import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
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