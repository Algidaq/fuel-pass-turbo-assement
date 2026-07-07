import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppHttpError, CS_ERRORS } from '../standard-errors';
import type { AuthenticatedRequest } from './auth.types';
import { REQUIRED_PERMISSIONS_METADATA_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
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

        throw new AppHttpError(HttpStatus.FORBIDDEN, CS_ERRORS.MissingRequiredPermissions);
    }
}
