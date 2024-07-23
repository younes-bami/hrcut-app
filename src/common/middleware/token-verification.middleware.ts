import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
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
      req.user = response.data;  // Utilisez l'interface personnalisée ici
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
