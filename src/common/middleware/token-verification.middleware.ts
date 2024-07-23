import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { CustomRequest } from '../interfaces/custom-request.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenVerificationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TokenVerificationMiddleware.name);

  constructor(private configService: ConfigService) {}

  async use(req: CustomRequest, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      this.logger.warn('Token not found in request headers');
      throw new UnauthorizedException('Token not found');
    }

    try {
      this.logger.debug(`Validating token: ${token}`);
      const response = await axios.post('http://localhost:3001/auth/validate', { token });
      const user = response.data;

      this.logger.debug(`Token validation successful: ${JSON.stringify(user)}`);
      this.logger.debug(`User permissions: ${JSON.stringify(user.permissions)}`);

      // Vérifiez les permissions
      const requiredPermissions = this.configService.get<string[]>('REQUIRED_PERMISSIONS') || [];
      if (!Array.isArray(requiredPermissions) || !this.hasRequiredPermissions(user.permissions || [], requiredPermissions)) {
        this.logger.warn('User does not have the required permissions');
        throw new ForbiddenException('Insufficient permissions');
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        this.logger.warn('User does not have the required permissions');
        throw error;
      }

      if (axios.isAxiosError(error) && error.response) {
        this.logger.error('Invalid token', error.response.data);
        throw new UnauthorizedException('Invalid token', error.response.data);
      }

      this.logger.error('Error during token validation', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private hasRequiredPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
}
