<div align="center">
  <br />
    <a href="https://www.pcfixbaru.com.ar" target="_blank">
      <img src="https://packages/web/public/logo.png" alt="PCFIX Logo" width="120"/>
    </a>
  <br />

  # 🖥️ PCFIX - E-Commerce Monorepo

  **Plataforma integral de comercio electrónico para hardware de alto rendimiento.**
  <br />
  *Arquitectura Moderna • Alto Rendimiento • Experiencia de Usuario Unificada*

  <br />

  <a href="https://www.pcfixbaru.com.ar">
    <img src="https://img.shields.io/badge/🚀_Demo_En_Vivo-www.pcfixbaru.com.ar-2ea44f?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Website"/>
  </a>
  <a href="https://github.com/martin-ratti/PCFIX-Baru">
    <img src="https://img.shields.io/badge/📦_Repo_Privado-v1.2.0-blue?style=for-the-badge&logo=github&logoColor=white" alt="Version"/>
  </a>
</div>

<br />

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node"/>
  <img src="https://img.shields.io/badge/NPM_Workspaces-Monorepo-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="NPM"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TS"/>
  <br/>
  <img src="https://img.shields.io/badge/Astro-5.0-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <br/>
  <img src="https://img.shields.io/badge/Express.js-5.0-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/PostgreSQL-DB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres"/>
  <br/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
  <img src="https://img.shields.io/badge/Railway-Backend-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" alt="Railway"/>
</div>

---

## ⚡ Sobre el Proyecto

**PCFIX** no es solo una tienda online, es una solución de arquitectura moderna diseñada para escalar. Construida sobre un **Monorepo NPM**, el proyecto orquesta una API robusta y un Frontend híbrido de última generación.

El objetivo principal es ofrecer una experiencia de compra instantánea (gracias a **Astro Server Islands** y SSR) manteniendo una interactividad fluida (con **React**), todo respaldado por un sistema de gestión administrativo completo.

### ✨ Características Clave
* **Performance Extrema:** Puntuación 95+ en Lighthouse gracias a Astro ViewTransitions y optimización de imágenes.
* **Gestión de Inventario Real:** Control de stock con alertas automáticas y detección de productos inactivos.
* **Pasarela de Pagos Híbrida:** Integración nativa con **MercadoPago**, Crypto (USDT) y pagos offline.
* **Admin Dashboard:** Panel de control integral con métricas, gráficos y gestión CRUD completa.

---

## 🛠️ Stack Tecnológico Completo

A continuación, se detalla el ecosistema técnico utilizado en el proyecto, extraído directamente del código fuente.

### 🎨 Frontend (`packages/web`)
| Categoría | Tecnología | Uso en el Proyecto |
| :--- | :--- | :--- |
| **Core Framework** | **Astro 5** | Renderizado híbrido (SSR + Static), Enrutamiento por archivos, View Transitions. |
| **UI Library** | **React 18** | Islas de interactividad (Carrito, Checkout, Modales de Admin, Autenticación). |
| **Estilos** | **Tailwind CSS** | Sistema de diseño Utility-first, responsive y dark mode ready. |
| **Iconografía** | **Lucide React** | Librería de iconos vectoriales coherente y ligera. |
| **Estado Global** | **Zustand** | Gestión de estado ligero y persistente (Carrito, Sesión de Usuario). |
| **Formularios** | **React Hook Form** | Manejo performante de formularios complejos (Registro, Checkout, Admin). |
| **Validación** | **Zod** | Esquemas de validación tipados compartidos con el backend. |
| **Feedback UI** | **Toastify / Custom** | Notificaciones toast no intrusivas para acciones del usuario. |

### ⚙️ Backend (`packages/api`)
| Categoría | Tecnología | Uso en el Proyecto |
| :--- | :--- | :--- |
| **Servidor** | **Express 5** | API RESTful moderna, manejo de rutas y middlewares asíncronos. |
| **ORM** | **Prisma 6** | Capa de acceso a datos type-safe, migraciones y modelado de relaciones complejas. |
| **Base de Datos** | **PostgreSQL** | Motor de base de datos relacional robusto (Alojado en Railway). |
| **Seguridad** | **Helmet & CORS** | Protección de headers HTTP y control de acceso de origen cruzado. |
| **Auth** | **JWT & Bcrypt** | Autenticación stateless segura y hasheo de contraseñas. |
| **Logging** | **Morgan** | Registro de peticiones HTTP para depuración y monitoreo. |
| **File Upload** | **Multer** | Middleware para la gestión de carga de archivos (multipart/form-data). |

### ☁️ Servicios e Integraciones
| Servicio | Propósito | Librería / Implementación |
| :--- | :--- | :--- |
| **MercadoPago** | Pasarela de Pagos | `mercadopago` SDK para checkout pro y gestión de pagos. |
| **Cloudinary** | CDN de Imágenes | Almacenamiento y optimización de imágenes de productos en la nube. |
| **Google Auth** | Social Login | `google-auth-library` para autenticación OAuth 2.0. |
| **Nodemailer** | Email Transaccional | Envío de confirmaciones de compra, recuperación de clave y alertas. |
| **Sentry** | Monitoreo | Trazabilidad de errores en tiempo real (Frontend y Backend). |

### 🏗️ Infraestructura y DevOps
* **Docker & Docker Compose:** Contenerización completa del entorno (Web, API, DB) para desarrollo local consistente.
* **NPM Workspaces:** Gestión eficiente de dependencias compartidas y scripts en el monorepo.
* **CI/CD (GitHub Actions):** Pipelines automatizados para testing y validación de código.
* **Testing Suite:**
    * **Vitest:** Unit testing ultra rápido para lógica de negocio y componentes.
    * **Playwright:** Pruebas End-to-End (E2E) para flujos críticos (Checkout, Login).

---

## 🏛️ Arquitectura del Sistema

```mermaid
graph TD
    subgraph Client [Cliente - Navegador]
        A[Astro SSR] -->|Hydrates| B[React Islands]
        B -->|Zustand| C[Client State]
    end

    subgraph Server [Backend API - Express]
        D[API Gateway / Routes] --> E[Controllers]
        E --> F[Services Layer]
        F --> G[Prisma ORM]
    end

    subgraph Services [Servicios Externos]
        H[PostgreSQL DB]
        I[Cloudinary CDN]
        J[MercadoPago]
        K[Google OAuth]
    end

    C -->|REST API Calls| D
    G --> H
    F --> I
    F --> J
    E --> K

```

---

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para levantar el entorno completo utilizando Docker (Recomendado).

1. **Clonar el repositorio:**
```bash
git clone [https://github.com/martin-ratti/PCFIX-Baru.git](https://github.com/martin-ratti/PCFIX-Baru.git)
cd PCFIX-Baru

```


2. **Configurar variables de entorno:**
Crea los archivos `.env` en `packages/api` y `packages/web` basándote en los ejemplos proporcionados en la documentación interna.
3. **Iniciar con Docker Compose:**
```bash
docker-compose up --build

```


* 🌐 **Frontend:** `http://localhost:4321`
* 🚀 **API:** `http://localhost:3002`
* 🗄️ **Prisma Studio:** `http://localhost:5555`



---

## 🧪 Comandos de Calidad

Asegura la calidad del código antes de enviar cambios:

| Comando | Descripción |
| --- | --- |
| `npm run test` | Ejecuta tests unitarios en todo el monorepo (Vitest). |
| `npm run e2e` | Ejecuta pruebas de integración visuales (Playwright). |
| `npm run lint` | Verifica reglas de estilo y errores estáticos. |
| `npm run typecheck` | Validación estricta de tipos TypeScript. |

---

<div align="center">
Desarrollado con 💙 por <b>Martin Ratti</b>
</div>
