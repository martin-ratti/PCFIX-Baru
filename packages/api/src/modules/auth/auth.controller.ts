import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message === 'El email ya est� registrado' ? 409 : 400;
    res.status(status).json({ success: false, error: error.message || error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message === 'Credenciales inv�lidas' ? 401 : 400;
    res.status(status).json({ success: false, error: error.message || error });
  }
};

export const loginGoogle = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'Falta el token de Google' });

        const result = await authService.loginWithGoogle(token);
        res.json({ success: true, data: result });
    } catch (e: any) {
        console.error("Google Login Error:", e.message);
        res.status(401).json({ success: false, error: 'Error autenticando con Google' });
    }
};
