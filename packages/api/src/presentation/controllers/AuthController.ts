// src/presentation/controllers/AuthController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { RegisterUser } from '../../application/use-cases/RegisterUser';
import { LoginUser } from '../../application/use-cases/LoginUser'; // IMPORTANTE
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { JwtTokenService } from '../../application/services/JwtTokenService'; // IMPORTANTE

// Esquemas Zod
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export class AuthController {
  private registerUserUseCase: RegisterUser;
  private loginUserUseCase: LoginUser; // Inyección

  constructor() {
    const userRepository = new PrismaUserRepository();
    const tokenService = new JwtTokenService(); // Instancia del servicio JWT
    
    this.registerUserUseCase = new RegisterUser(userRepository);
    this.loginUserUseCase = new LoginUser(userRepository, tokenService);
  }

  // ... (tu método register existente se queda igual) ...
  register = async (req: Request, res: Response) => {
     // ... (tu código anterior aquí)
     try {
      const validatedData = registerSchema.parse(req.body);
      const user = await this.registerUserUseCase.execute(validatedData);
      res.status(201).json({ success: true, data: user, message: 'Usuario registrado exitosamente' });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(', ') });
      const statusCode = error.message === 'El email ya está registrado' ? 409 : 500;
      res.status(statusCode).json({ success: false, error: error.message });
    }
  };

  // NUEVO MÉTODO LOGIN
  login = async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const result = await this.loginUserUseCase.execute(validatedData);

      res.status(200).json({
        success: true,
        data: result, // Incluye user y token
        message: 'Sesión iniciada correctamente',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(', ') });
      }
      
      // Si es error de credenciales, retornamos 401 Unauthorized
      const statusCode = error.message === 'Credenciales inválidas' ? 401 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  };
}