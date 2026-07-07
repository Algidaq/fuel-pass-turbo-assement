import { SetMetadata } from '@nestjs/common';
import type { OrderPermissionKey } from '@fuel-pass/contracts/backend';

export const REQUIRED_PERMISSIONS_METADATA_KEY = 'orders:required-permissions';

export function RequirePermissions(...permissions: OrderPermissionKey[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
}
