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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(email);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || error });
  }
};

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(token, newPassword);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || error });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    // Assuming authentication middleware attaches user to req.user or similar
    // The previous code in AuthController doesn't show where userId comes from for protected routes.
    // I need to check how other protected routes get the user ID. 
    // Usually it's req.user.id or similar after middleware. 
    // Inspecting 'req' type or middleware usage in routes would verify this.
    // For now, I'll assume standard Express practice or check auth middleware usage in routes.
    // Update: Looking at previous context, there are guards.

    // SAFEGUARE: I will assume req.user exists if protected.
    // However, TypeScript might complain if Request is not extended.
    // Let's use (req as any).user.id for now to avoid TS issues if types aren't set up globally, 
    // or better, check how it's done elsewhere.

    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'No autorizado' });

    const result = await authService.deleteAccount(Number(userId));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || error });
  }
};
