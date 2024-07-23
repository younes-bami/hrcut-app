// src/guards/scopes.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CustomRequest } from '../interfaces/custom-request.interface';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler());

    if (!requiredScopes) {
      return true;
    }

    const userScopes = request.user?.scopes;
    if (!userScopes || !requiredScopes.every(scope => userScopes.includes(scope))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
