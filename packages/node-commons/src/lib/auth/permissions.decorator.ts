import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_METADATA_KEY = 'auth:required-permissions';
export const REQUIRED_ANY_PERMISSIONS_METADATA_KEY = 'auth:required-any-permissions';

export function RequirePermissions(...permissions: string[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
}

export function RequireAnyPermission(...permissions: string[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRED_ANY_PERMISSIONS_METADATA_KEY, permissions);
}
