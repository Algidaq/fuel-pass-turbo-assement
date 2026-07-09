import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppHttpError, CS_ERRORS } from '../standard-errors';
import type { AuthenticatedRequest } from './auth.types';
import { REQUIRED_ANY_PERMISSIONS_METADATA_KEY, REQUIRED_PERMISSIONS_METADATA_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    public constructor(private readonly reflector: Reflector) {}

    public canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_METADATA_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const requiredAnyPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_ANY_PERMISSIONS_METADATA_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (
            (requiredPermissions === undefined || requiredPermissions.length === 0) &&
            (requiredAnyPermissions === undefined || requiredAnyPermissions.length === 0)
        ) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const permissions = new Set(request.auth.permissions);
        const hasAllPermissions =
            requiredPermissions === undefined || requiredPermissions.length === 0
                ? true
                : requiredPermissions.every((permission): boolean => permissions.has(permission));
        const hasAnyPermission =
            requiredAnyPermissions === undefined || requiredAnyPermissions.length === 0
                ? true
                : requiredAnyPermissions.some((permission): boolean => permissions.has(permission));

        if (hasAllPermissions && hasAnyPermission) {
            return true;
        }

        throw new AppHttpError(HttpStatus.FORBIDDEN, CS_ERRORS.MissingRequiredPermissions);
    }
}
