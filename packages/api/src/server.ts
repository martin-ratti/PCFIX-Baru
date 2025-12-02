import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { prisma } from './shared/database/prismaClient';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import categoriesRoutes from './modules/categories/categories.routes';
// Imports recuperados
import brandsRoutes from './modules/brands/brands.routes';
import bannersRoutes from './modules/banners/banners.routes';
import statsRoutes from './modules/stats/stats.routes';
import usersRoutes from './modules/users/users.routes';
import salesRoutes from './modules/sales/sales.routes';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/uploads', (req, res, next) => {
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Rutas Conectadas
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);   // Marcas
app.use('/api/banners', bannersRoutes); // Banners
app.use('/api/stats', statsRoutes);     // Dashboard
app.use('/api/users', usersRoutes);
app.use('/api/sales', salesRoutes);

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, message: 'API is healthy', database: 'Connected' });
  } catch (error) {
    console.error('Database Check Failed:', error);
    res.status(500).json({ success: false, message: 'API Error', database: 'Disconnected', error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
});