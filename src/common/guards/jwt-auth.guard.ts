import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('JwtAuthGuard - canActivate method');
    try {
      const result = await super.canActivate(context);
      this.logger.log(`CanActivate result: ${result}`);
      return result as boolean;
    } catch (error) {
      this.logger.error('Error in canActivate', error);
      throw error;
    }
  }

  handleRequest(err: Error, user: any, info: string, context: ExecutionContext) {
    this.logger.log('Handle Request');

    if (err) {
      this.logger.error('Error in JwtAuthGuard', err);
      throw err;
    }
    if (!user || !user.sub) {
      this.logger.warn('Unauthorized access attempt');
      throw new UnauthorizedException();
    }
    this.logger.log(`User found in JwtAuthGuard: ${JSON.stringify(user)}`);
    return user;
  }
}


//Performance : Évaluez la performance en cas de charge élevée, surtout si le microservice Auth est sollicité fréquemment.