import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_METADATA_KEY } from './permissions.decorator';
import type { AuthenticatedRequest } from '../types/auth-request.types';

@Injectable()
export class OrdersPermissionsGuard implements CanActivate {
    public constructor(private readonly reflector: Reflector) {}

    public canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_METADATA_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiredPermissions === undefined || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const permissions = new Set(request.auth.permissions);
        const hasAllPermissions = requiredPermissions.every((permission): boolean => permissions.has(permission));

        if (hasAllPermissions) {
            return true;
        }

        throw new ForbiddenException('Missing required permission.');
    }
}
