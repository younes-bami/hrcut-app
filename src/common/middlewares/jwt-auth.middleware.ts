import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request, Response, NextFunction } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      this.logger.warn('Authorization header is missing');
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      this.logger.warn('Token is missing');
      throw new UnauthorizedException('Token is missing');
    }

    try {
      this.logger.log(`Validating token: ${token}`);
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/validate-token`, { token })
      );
      this.logger.log(`Token validated successfully: ${JSON.stringify(response.data)}`);
      
      req.user = response.data;
      next();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Invalid token', error.message);
      } else {
        this.logger.error('Invalid token');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
