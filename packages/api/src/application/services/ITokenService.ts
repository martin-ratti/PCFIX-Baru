// src/application/services/ITokenService.ts
export interface ITokenService {
  generate(payload: object): string;
  verify(token: string): object | string;
}