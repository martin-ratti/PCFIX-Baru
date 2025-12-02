<h1>🖥️ PCFIX - E-Commerce Monorepo</h1>

<div align="center">
    <a href="#" target="_blank" style="text-decoration: none;">
        <img src="https://img.shields.io/badge/💻%20Repo%20Principal-PCFIX-121D40?style=for-the-badge&logo=github&logoColor=white" alt="Repo PCFIX"/>
    </a>
</div>

<br />

<p align="center">
    <img src="https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Frontend-Astro%205-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro"/>
    <img src="https://img.shields.io/badge/Interactive-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
    <img src="https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
    <img src="https://img.shields.io/badge/Lang-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
    <img src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
</p>

<hr>

<h2>🎯 Objetivo</h2>

<p>
    <strong>PCFIX</strong> es una plataforma de comercio electrónico moderna y de alto rendimiento dedicada a la venta de hardware y periféricos de computación.
</p>

<p>
    El proyecto implementa una arquitectura de <strong>Monorepo</strong> utilizando <strong>NPM Workspaces</strong>, separando claramente la responsabilidad entre el cliente (Frontend) y el servidor (Backend API), pero compartiendo un entorno de desarrollo unificado.
</p>

<ul>
    <li><strong>Performance First:</strong> Utiliza Astro con renderizado híbrido (SSR) para una velocidad de carga inicial óptima y React para islas de interactividad.</li>
    <li><strong>Clean Architecture:</strong> El backend sigue una arquitectura modular escalable.</li>
    <li><strong>Gestión de Estado:</strong> Carrito de compras persistente y autenticación robusta.</li>
</ul>

<hr>

<h2>🧱 Stack Tecnológico</h2>

<table>
 <thead>
  <tr>
   <th>Capa</th>
   <th>Tecnología</th>
   <th>Detalles</th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td><strong>Frontend Core</strong></td>
   <td>Astro 5.x</td>
   <td>Server-Side Rendering (SSR) con ViewTransitions para navegación tipo SPA.</td>
  </tr>
  <tr>
   <td><strong>Interactividad</strong></td>
   <td>React 18 + Zustand</td>
   <td>Islas interactivas para Carrito, Auth y Admin. Persistencia en LocalStorage.</td>
  </tr>
  <tr>
   <td><strong>Estilos</strong></td>
   <td>Tailwind CSS</td>
   <td>Diseño responsivo, utilitario y sistema de diseño consistente.</td>
  </tr>
  <tr>
   <td><strong>Backend API</strong></td>
   <td>Express.js 5 + TS</td>
   <td>API RESTful tipada, organizada por módulos (Auth, Products, Categories).</td>
  </tr>
  <tr>
   <td><strong>Base de Datos</strong></td>
   <td>PostgreSQL + Prisma</td>
   <td>Relacional. Modelado de datos complejo (User, Product, Category, Sales).</td>
  </tr>
  <tr>
   <td><strong>Validación</strong></td>
   <td>Zod</td>
   <td>Validación de esquemas compartida tanto en Frontend (Forms) como Backend.</td>
  </tr>
  <tr>
   <td><strong>Media</strong></td>
   <td>Multer</td>
   <td>Gestión de subida de imágenes locales al servidor.</td>
  </tr>
  <tr>
   <td><strong>Seguridad</strong></td>
   <td>JWT + BCrypt</td>
   <td>Autenticación Stateless mediante JSON Web Tokens.</td>
  </tr>
 </tbody>
</table>

<hr>

<h2>🏛️ Arquitectura del Monorepo</h2>

<pre>
PCFIX/
├── packages/
│   ├── api/          # Backend (Express, Prisma, Logic)
│   │   ├── prisma/   # Schemas y Migraciones
│   │   └── src/
│   │       ├── modules/  # Modular Clean Architecture (Auth, Products...)
│   │       └── shared/   # Middlewares, DB Client, Utils
│   │
│   └── web/          # Frontend (Astro, React)
│       ├── src/
│       │   ├── components/ # Organizados por feature (admin, cart, layout...)
│       │   ├── pages/      # Rutas del sistema (File-based routing)
│       │   └── stores/     # Estado global (Zustand)
│
└── package.json      # Orquestador del Monorepo
</pre>

<hr>

<h2>🧩 Funcionalidades Principales</h2>

<ul>
    <li><strong>Catálogo Dinámico</strong>
        <ul>
            <li>Filtrado de productos por categorías en tiempo real.</li>
            <li>Páginas de detalle de producto con renderizado en servidor (SSR) para SEO.</li>
            <li>Imágenes optimizadas y servidas estáticamente.</li>
        </ul>
    </li>
    <li><strong>Panel de Administración</strong>
        <ul>
            <li>Rutas protegidas (`AdminGuard`) para roles específicos.</li>
            <li>Formulario de alta de productos con validación robusta (`react-hook-form` + `zod`).</li>
            <li>Subida de imágenes (File Upload) integrada.</li>
        </ul>
    </li>
    <li><strong>Sistema de Autenticación</strong>
        <ul>
            <li>Registro y Login con validación de credenciales y seguridad.</li>
            <li>Manejo de sesiones mediante JWT y persistencia en cliente.</li>
            <li>Menú de usuario contextual (invitado vs logueado vs admin).</li>
        </ul>
    </li>
    <li><strong>Carrito de Compras</strong>
        <ul>
            <li>Agregar, eliminar y modificar cantidades.</li>
            <li>Cálculo de subtotales en tiempo real.</li>
            <li>Persistencia de datos entre recargas.</li>
        </ul>
    </li>
</ul>

<hr>

<h2>🚀 Puesta en Marcha</h2>

<h3>1. Requisitos Previos</h3>
<ul>
    <li>Node.js (v18 o superior)</li>
    <li>PostgreSQL (Instancia local o remota)</li>
</ul>

<h3>2. Instalación</h3>

```bash
# Instalar dependencias para todo el monorepo
npm install
````

\<h3\>3. Configuración de Entorno\</h3\>
Crea un archivo `.env` en `packages/api/` con:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pcfix_db"
JWT_SECRET="tu_secreto_super_seguro"
PORT=3002
```

\<h3\>4. Base de Datos\</h3\>

```bash
cd packages/api
# Generar cliente y aplicar migraciones
npx prisma generate
npx prisma db push

# (Opcional) Poblar base de datos con datos de prueba
npx ts-node prisma/seed.ts
```

\<h3\>5. Ejecución\</h3\>

Puedes correr ambos proyectos (frontend y backend) simultáneamente desde la raíz si configuras `concurrently`, o en terminales separadas:

**Terminal 1 (Backend):**

```bash
cd packages/api
npm run dev
# Corre en http://localhost:3002
```

**Terminal 2 (Frontend):**

```bash
cd packages/web
npm run dev
# Corre en http://localhost:4321
```

<hr>

<h2>👥 Equipo<h2>

<p>Proyecto desarrollado con pasión por la arquitectura de software limpia.<p>

<li><strong>Martin Ratti<strong> - <em>Full Stack Developer & Architect<em><li>
