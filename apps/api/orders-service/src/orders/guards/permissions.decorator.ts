import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_METADATA_KEY = 'orders:required-permissions';

export function RequirePermissions(...permissions: string[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
}
