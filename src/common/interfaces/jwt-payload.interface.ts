// src/common/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  scopes?: string[]; // Ajout de la propriété scopes
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}
