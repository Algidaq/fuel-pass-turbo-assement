import type { PermissionKey } from '@fuel-pass/contracts';
import type { AuthUser } from '../types/auth.types';

type UserWithPermissions = Pick<AuthUser, 'permissions'> | null | undefined;

export const normalizePermission = (permission: string): string => permission.trim();

export const hasPermission = (user: UserWithPermissions, permission: PermissionKey): boolean => hasAnyPermission(user, [permission]);

export const hasAnyPermission = (user: UserWithPermissions, permissions: readonly PermissionKey[]): boolean => {
    if (!user || permissions.length === 0) {
        return false;
    }

    const userPermissions = user.permissions ?? [];
    const normalizedAllowedPermissions = new Set(permissions.map(normalizePermission));

    return userPermissions.some((permission) => normalizedAllowedPermissions.has(normalizePermission(permission)));
};

export const hasAllPermissions = (user: UserWithPermissions, permissions: readonly PermissionKey[]): boolean => {
    if (!user || permissions.length === 0) {
        return false;
    }

    const userPermissions = new Set((user.permissions ?? []).map(normalizePermission));

    return permissions.every((permission) => userPermissions.has(normalizePermission(permission)));
};
