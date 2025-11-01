/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'primary': '#121D40',     // Azul oscuro principal
        'secondary': '#111626',   // Azul casi negro
        'accent': '#96B3D9',      // Azul claro
        'muted': '#626973',       // Gris
        'light': '#F2F2F2',       // Blanco/Grisáceo claro
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}