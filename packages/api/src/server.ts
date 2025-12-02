import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './shared/database/prismaClient';
import authRoutes from './modules/auth/auth.routes';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRawSELECT 1;
    res.status(200).json({ success: true, message: 'API is healthy', database: 'Connected' });
  } catch (error) {
    console.error('Database Check Failed:', error);
    res.status(500).json({ success: false, message: 'API Error', database: 'Disconnected', error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log('?? Server running on http://localhost:' + PORT);
});
