# 🖥️ PCFIX - E-Commerce Monorepo

<div align="center">
    <a href="https://deepwiki.com/martin-ratti/PCFIX-Baru" target="_blank">
        <img src="https://img.shields.io/badge/💻%20DeepWiki-Documentación-121D40?style=for-the-badge&logo=confluence&logoColor=white" alt="DeepWiki PCFIX"/>
    </a>
</div>

<br />

<div align="center">
    <img src="https://img.shields.io/badge/Runtime-Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Frontend-Astro%205-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro"/>
    <img src="https://img.shields.io/badge/Interactive-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
    <img src="https://img.shields.io/badge/Backend-Express.js_5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
    <img src="https://img.shields.io/badge/Lang-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/ORM-Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
    <img src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
    <img src="https://img.shields.io/badge/Testing-Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest"/>
</div>

---

## 🎯 Objetivo

**PCFIX** es una plataforma de comercio electrónico moderna y de alto rendimiento dedicada a la venta de hardware, periféricos de computación y servicios técnicos.

El proyecto implementa una arquitectura de **Monorepo** utilizando **NPM Workspaces**, separando claramente la responsabilidad entre el cliente (*Frontend*) y el servidor (*Backend API*), pero compartiendo un entorno de desarrollo unificado.

* **Performance First:** Utiliza Astro con renderizado híbrido (SSR) para una velocidad de carga inicial óptima y React para islas de interactividad.
* **Clean Architecture:** El backend sigue una arquitectura modular escalable con separación por capas.
* **Gestión de Estado:** Carrito de compras persistente, favoritos sincronizados y autenticación robusta.
* **Test Coverage:** Suite completa de tests unitarios con Vitest tanto en frontend como backend.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Detalles |
| :--- | :--- | :--- |
| **Frontend Core** | Astro 5.x | Server-Side Rendering (SSR) con ViewTransitions para navegación tipo SPA. |
| **Interactividad** | React 18 + Zustand | Islas interactivas para Carrito, Auth, Favoritos y Admin. Persistencia en LocalStorage. |
| **Estilos** | Tailwind CSS | Diseño responsivo, utilitario y sistema de diseño consistente con micro-animaciones. |
| **Backend API** | Express.js 5 + TS | API RESTful tipada, organizada por módulos (Auth, Products, Sales, Config...). |
| **Base de Datos** | PostgreSQL + Prisma | Relacional. Modelado de datos complejo (User, Product, Venta, Consulta). |
| **Validación** | Zod | Validación de esquemas compartida tanto en Frontend (Forms) como Backend. |
| **Media** | Multer | Gestión de subida de imágenes locales al servidor. |
| **Seguridad** | JWT + BCrypt | Autenticación Stateless mediante JSON Web Tokens. |
| **OAuth** | Google Sign-In | Login social integrado con Google OAuth 2.0. |
| **Email** | Nodemailer | Notificaciones transaccionales (confirmación de compra, alertas de stock). |
| **Testing** | Vitest + Testing Library | Tests unitarios y de integración para ambos packages. |
| **Charts** | Recharts | Visualización de datos en el dashboard de inteligencia comercial. |

---

## 🏛️ Arquitectura del Monorepo

```bash
PCFIX/
├── packages/
│   ├── api/              # Backend (Express, Prisma, Logic)
│   │   ├── prisma/       # Schemas y Migraciones
│   │   └── src/
│   │       ├── modules/  # Modular Architecture
│   │       │   ├── auth/         # Autenticación (JWT, Google OAuth)
│   │       │   ├── products/     # CRUD Productos + Stock Alerts
│   │       │   ├── sales/        # Ventas web + POS
│   │       │   ├── stats/        # Dashboard Intelligence
│   │       │   ├── categories/   # Categorías jerárquicas
│   │       │   ├── brands/       # Marcas
│   │       │   ├── banners/      # Banners promocionales
│   │       │   ├── favorites/    # Favoritos de usuario
│   │       │   ├── cart/         # Carrito persistente
│   │       │   ├── config/       # Configuración del sistema
│   │       │   └── technical/    # Consultas técnicas / Soporte
│   │       └── shared/   # Middlewares, DB Client, Utils
│   │
│   └── web/              # Frontend (Astro, React)
│       ├── src/
│       │   ├── components/
│       │   │   ├── admin/     # Dashboard, Productos, Ventas, Config
│       │   │   ├── store/     # Catálogo, Carrito, Checkout, Perfil
│       │   │   └── ui/        # Componentes reutilizables (modals, forms...)
│       │   ├── pages/         # Rutas del sistema (File-based routing)
│       │   ├── stores/        # Estado global (Zustand + persistencia)
│       │   └── styles/        # Estilos globales + animaciones
│
├── .github/workflows/    # CI/CD con GitHub Actions
└── package.json          # Orquestador del Monorepo
```

---

## 🧩 Funcionalidades Principales

### 🛍️ Tienda Online
* **Catálogo Dinámico** - Filtrado por categoría, marca y búsqueda en tiempo real.
* **Páginas de Producto** - SSR para SEO óptimo con imágenes optimizadas.
* **Carrito Inteligente** - Persistencia, cálculo automático de envío, múltiples métodos de pago.
* **Favoritos** - Lista de deseos sincronizada con el servidor.
* **Alertas de Stock** - Notificación por email cuando un producto vuelve a estar disponible.
* **Checkout Completo** - Transferencia, efectivo (retiro), tarjeta (ViüMi), USDT.

### 👤 Sistema de Usuarios
* **Autenticación Híbrida** - Email/password + Google OAuth.
* **Registro/Login Unificado** - Formularios con validación en tiempo real.
* **Recuperación de Contraseña** - Flujo completo con tokens temporales.
* **Perfil de Usuario** - Edición de datos, historial de compras, información de cuenta.

### 🛠️ Panel de Administración
* **Dashboard Inteligente** - KPIs (ingresos, inventario, stock bajo), gráficos de tendencias.
* **Gestión de Productos** - CRUD completo con imágenes, descuentos, stock alerts.
* **Punto de Venta (POS)** - Ventas en efectivo directas desde el panel.
* **Gestión de Ventas** - Estados (pendiente, aprobado, despachado), comprobantes.
* **Soporte Técnico** - Bandeja de consultas con sistema de respuestas.
* **Marketing** - Gestión de banners, marcas y categorías.
* **Configuración** - Datos bancarios, cotización USDT, datos del local.

### 📊 Inteligencia Comercial
* **Facturación Mensual** - Con filtrado por período y método de pago.
* **Productos Más Vendidos** - Top 5 de los últimos 30 días.
* **Dead Stock Detection** - Productos sin movimiento >90 días.
* **Ofertas Flash** - Descuentos rápidos desde el dashboard.

---

## 🚀 Puesta en Marcha

### 1. Requisitos Previos

* Node.js (v20 o superior)
* PostgreSQL (Instancia local o remota)

### 2. Instalación

```bash
# Clonar repositorio
git clone https://github.com/martin-ratti/PCFIX-Baru.git
cd PCFIX-Baru

# Instalar dependencias para todo el monorepo
npm install
```

### 3. Configuración de Entorno

Crea un archivo `.env` en `packages/api/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pcfix_db"
JWT_SECRET="tu_secreto_super_seguro"
PORT=3002
FRONTEND_URL="http://localhost:4321"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu@email.com"
SMTP_PASS="app_password"
```

Crea un archivo `.env` en `packages/web/`:

```env
PUBLIC_API_URL="http://localhost:3002/api"
PUBLIC_GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
```

### 4. Base de Datos

```bash
cd packages/api

# Generar cliente Prisma
npx prisma generate

# Aplicar schema a la base de datos
npx prisma db push

# (Opcional) Poblar base de datos con datos de prueba
npx ts-node prisma/seed.ts
```

### 5. Ejecución

**Terminal 1 (Backend):**

```bash
cd packages/api
npm run dev
# 🚀 API corriendo en http://localhost:3002
```

**Terminal 2 (Frontend):**

```bash
cd packages/web
npm run dev
# 🌐 Web corriendo en http://localhost:4321
```

---

## 🧪 Testing

```bash
# Tests del Backend
cd packages/api
npm test

# Tests del Frontend
cd packages/web
npm test

# Tests con watch mode
npm run test:watch
```

---

## 📜 Scripts Disponibles

| Script | Ubicación | Descripción |
| :--- | :--- | :--- |
| `npm run dev` | api / web | Inicia servidor de desarrollo |
| `npm run build` | api / web | Compila para producción |
| `npm test` | api / web | Ejecuta suite de tests |
| `npm run test:watch` | web | Tests en modo watch |
| `npx prisma studio` | api | Abre UI para explorar la DB |
| `npx prisma db push` | api | Sincroniza schema con DB |

---

## 🔐 Seguridad

* **Autenticación JWT** - Tokens firmados con expiración configurable.
* **Rate Limiting** - Protección contra brute force en auth y API.
* **Helmet** - Headers HTTP seguros.
* **CORS** - Configuración granular por origen.
* **Soft Deletes** - Los productos eliminados no se pierden.
* **Validación Zod** - Input sanitization en todas las rutas.

---

## 👥 Equipo

Proyecto desarrollado con pasión por la arquitectura de software limpia.

* **Martin Ratti** - *Full Stack Developer & Architect*

---

<div align="center">
    <sub>Construido con ❤️ y mucho ☕</sub>
</div>
