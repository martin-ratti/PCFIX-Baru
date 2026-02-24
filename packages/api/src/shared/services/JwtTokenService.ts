
import jwt from 'jsonwebtoken';

export class JwtTokenService {
  private readonly secret: string;
  private readonly expiresIn = '7d';

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    }
    this.secret = process.env.JWT_SECRET;
  }

  generate(payload: object): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error("Invalid Token");
    }
  }
}