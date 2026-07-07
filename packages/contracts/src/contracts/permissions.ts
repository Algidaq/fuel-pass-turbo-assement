import { ORDER_PERMISSIONS } from './orders/order.permissions.js';

export const PERMISSIONS = {
    ...ORDER_PERMISSIONS,
} as const;

export type PermissionName = keyof typeof PERMISSIONS;
export type PermissionKey = (typeof PERMISSIONS)[PermissionName]['key'];

export const permissionKeys: readonly PermissionKey[] = Object.values(PERMISSIONS).map((permission): PermissionKey => permission.key);

const permissionKeySet: ReadonlySet<string> = new Set(permissionKeys);

export function isPermissionKey(value: string): value is PermissionKey {
    return permissionKeySet.has(value);
}
