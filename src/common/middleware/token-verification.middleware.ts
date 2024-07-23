import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { CustomRequest } from '../interfaces/custom-request.interface';

@Injectable()
export class TokenVerificationMiddleware implements NestMiddleware {
  async use(req: CustomRequest, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const response = await axios.post('http://localhost:3001/auth/validate', { token });
      const user = response.data;

      // Vérifiez les scopes
      const requiredScopes = ['required_scope_1', 'required_scope_2']; // Remplacez par les scopes requis
      if (!this.hasRequiredScopes(user.scopes, requiredScopes)) {
        throw new ForbiddenException('Insufficient scopes');
      }

      req.user = user;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
    if (!userScopes) return false;
    return requiredScopes.every(scope => userScopes.includes(scope));
  }
}
