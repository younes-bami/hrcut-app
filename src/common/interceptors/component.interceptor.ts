// common/interceptors/component.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { COMPONENT_KEY } from '../decorators/component.decorator';

@Injectable()
export class ComponentInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ComponentInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;

    this.logger.debug(`Intercepting call in component: ${className}`);

    return next.handle().pipe(
      tap({
        error: (err) => {
          (err as any).component = className;
        },
      }),
    );
  }
}
