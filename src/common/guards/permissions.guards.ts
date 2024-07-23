import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CustomRequest } from '../interfaces/custom-request.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<CustomRequest>();
    const userPermissions = request.user?.permissions;

    if (!userPermissions || !requiredPermissions.every(permission => userPermissions.includes(permission))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
