import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { prisma } from './shared/database/prismaClient';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import brandsRoutes from './modules/brands/brands.routes';
import bannersRoutes from './modules/banners/banners.routes';
import statsRoutes from './modules/stats/stats.routes';
import usersRoutes from './modules/users/users.routes';
import salesRoutes from './modules/sales/sales.routes';
import configRoutes from './modules/config/config.routes';
import favoritesRoutes from './modules/favorites/favorites.routes';
import technicalRoutes from './modules/technical/technical.routes';

const app = express();
const PORT = process.env.PORT || 3002;

// --- CONFIGURACIÓN DE SEGURIDAD Y CORS (CRÍTICO) ---

// Lista blanca de dominios permitidos
const whitelist = [
  'http://localhost:4321',          // Tu entorno local Astro
  'http://localhost:3002',          // Tu entorno local API (Swagger/Postman)
  'https://pcfixbaru.com.ar',       // DOMINIO REAL (Sin www)
  'https://www.pcfixbaru.com.ar',   // DOMINIO REAL (Con www)
  // Agrega aquí la URL que te dé Vercel al desplegar (ej: https://pcfix.vercel.app)
];

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // !origin permite peticiones server-to-server o herramientas como Postman
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`Bloqueado por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permite cookies/tokens si los usas
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Helmet ayuda a asegurar headers HTTP
// crossOriginResourcePolicy: "cross-origin" es vital para que las imágenes se vean
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

app.use(morgan('dev'));
app.use(express.json());

// --- ARCHIVOS ESTÁTICOS ---
// Nota para Producción: Recuerda que en Railway/Render los archivos subidos aquí
// se borrarán en cada despliegue. Idealmente migrar a Cloudinary.
app.use('/uploads', (req, res, next) => {
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/config', configRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/technical', technicalRoutes);

// --- HEALTH CHECK ---
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      success: true, 
      message: 'API is healthy', 
      database: 'Connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Database Check Failed:', error);
    res.status(500).json({ success: false, message: 'API Error', database: 'Disconnected', error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  CORS Whitelist:`, whitelist);
});