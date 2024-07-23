// src/common/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  scope?: string[]; // Ajout de la propriété scopes
  permissions?: string[]; // Ajout de la propriété permissions
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}
