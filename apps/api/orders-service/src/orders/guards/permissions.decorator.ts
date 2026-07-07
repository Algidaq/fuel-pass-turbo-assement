import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@fuel-pass/contracts/backend';

export const REQUIRED_PERMISSIONS_METADATA_KEY = 'orders:required-permissions';

export function RequirePermissions(...permissions: PermissionKey[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
}
