export interface JwtPayload {
    sub: string;
    email: string;
    name: string;
    iat?: number;
    exp?: number;
    iss?: string; // Ajoutez cette ligne
    aud?: string; // Ajoutez cette ligne
    // Ajoutez d'autres champs nécessaires selon votre payload JWT
  }
  