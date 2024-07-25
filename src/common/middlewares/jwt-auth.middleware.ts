import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request, Response, NextFunction } from 'express';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService, // Assurez-vous que HttpService est injecté ici
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
      const response = await lastValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/validate-token`, { token })
      );
      req.user = response.data;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
