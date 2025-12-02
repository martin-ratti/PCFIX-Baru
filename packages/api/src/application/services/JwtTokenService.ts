// src/infrastructure/services/JwtTokenService.ts
import jwt from 'jsonwebtoken';
import { ITokenService } from '../../application/services/ITokenService';

export class JwtTokenService implements ITokenService {
  // En producción, esto debe venir de process.env.JWT_SECRET
  private readonly secret = process.env.JWT_SECRET || 'secret_dev_key_unsafe';
  private readonly expiresIn = '7d'; // El token dura 7 días

  generate(payload: object): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): object | string {
    return jwt.verify(token, this.secret);
  }
}