import jwt from 'jsonwebtoken';

export class JwtTokenService {
  private readonly secret = process.env.JWT_SECRET || 'secret_dev_key_unsafe';
  private readonly expiresIn = '7d';

  generate(payload: object): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): object | string {
    return jwt.verify(token, this.secret);
  }
}
