# 🖥️ PCFIX - E-Commerce Monorepo

<div align="center">
    <a href="https://deepwiki.com/martin-ratti/PCFIX-Baru" target="_blank">
        <img src="https://img.shields.io/badge/💻%20DeepWiki-Documentación-121D40?style=for-the-badge&logo=confluence&logoColor=white" alt="DeepWiki PCFIX"/>
    </a>
</div>

<br />

<div align="center">
    <img src="https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Frontend-Astro%205-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro"/>
    <img src="https://img.shields.io/badge/Interactive-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
    <img src="https://img.shields.io/badge/Backend-Express.js_5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
    <img src="https://img.shields.io/badge/Lang-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/ORM-Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
    <img src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
</div>

---

## 🎯 Objetivo

**PCFIX** es una plataforma de comercio electrónico moderna y de alto rendimiento dedicada a la venta de hardware y periféricos de computación.

El proyecto implementa una arquitectura de **Monorepo** utilizando **NPM Workspaces**, separando claramente la responsabilidad entre el cliente (*Frontend*) y el servidor (*Backend API*), pero compartiendo un entorno de desarrollo unificado.

* **Performance First:** Utiliza Astro con renderizado híbrido (SSR) para una velocidad de carga inicial óptima y React para islas de interactividad.
* **Clean Architecture:** El backend sigue una arquitectura modular escalable.
* **Gestión de Estado:** Carrito de compras persistente y autenticación robusta.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Detalles |
| :--- | :--- | :--- |
| **Frontend Core** | Astro 5.x | Server-Side Rendering (SSR) con ViewTransitions para navegación tipo SPA. |
| **Interactividad** | React 18 + Zustand | Islas interactivas para Carrito, Auth y Admin. Persistencia en LocalStorage. |
| **Estilos** | Tailwind CSS | Diseño responsivo, utilitario y sistema de diseño consistente. |
| **Backend API** | Express.js 5 + TS | API RESTful tipada, organizada por módulos (Auth, Products, Categories). |
| **Base de Datos** | PostgreSQL + Prisma | Relacional. Modelado de datos complejo (User, Product, Category, Sales). |
| **Validación** | Zod | Validación de esquemas compartida tanto en Frontend (Forms) como Backend. |
| **Media** | Multer | Gestión de subida de imágenes locales al servidor. |
| **Seguridad** | JWT + BCrypt | Autenticación Stateless mediante JSON Web Tokens. |

---

## 🏛️ Arquitectura del Monorepo

```bash
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
````

-----

## 🧩 Funcionalidades Principales

  * **Catálogo Dinámico**
      * Filtrado de productos por categorías en tiempo real.
      * Páginas de detalle de producto con renderizado en servidor (SSR) para SEO.
      * Imágenes optimizadas y servidas estáticamente.
  * **Panel de Administración**
      * Rutas protegidas (`AdminGuard`) para roles específicos.
      * Formulario de alta de productos con validación robusta (`react-hook-form` + `zod`).
      * Subida de imágenes (File Upload) integrada.
  * **Sistema de Autenticación**
      * Registro y Login con validación de credenciales y seguridad.
      * Manejo de sesiones mediante JWT y persistencia en cliente.
      * Menú de usuario contextual (invitado vs logueado vs admin).
  * **Carrito de Compras**
      * Agregar, eliminar y modificar cantidades.
      * Cálculo de subtotales en tiempo real.
      * Persistencia de datos entre recargas.

-----

## 🚀 Puesta en Marcha

### 1\. Requisitos Previos

  * Node.js (v18 o superior)
  * PostgreSQL (Instancia local o remota)

### 2\. Instalación

```bash
# Instalar dependencias para todo el monorepo
npm install
```

### 3\. Configuración de Entorno

Crea un archivo `.env` en `packages/api/` con:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pcfix_db"
JWT_SECRET="tu_secreto_super_seguro"
PORT=3002
```

### 4\. Base de Datos

```bash
cd packages/api
# Generar cliente y aplicar migraciones
npx prisma generate
npx prisma db push

# (Opcional) Poblar base de datos con datos de prueba
npx ts-node prisma/seed.ts
```

### 5\. Ejecución

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

-----

## 👥 Equipo

Proyecto desarrollado con pasión por la arquitectura de software limpia.

  * **Martin Ratti** - *Full Stack Developer & Architect*

<!-- end list -->
