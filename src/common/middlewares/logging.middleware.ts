import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const message = `${method} ${originalUrl}`;
    
    this.logger.log(`Request: ${message}`);

    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`Response: ${statusCode} ${message}`);
    });

    next();
  }
}
