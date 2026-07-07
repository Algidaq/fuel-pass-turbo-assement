import type { AuthUser } from '../types/auth.types';

export const roles = {
    aircraftOperator: 'AIRCRAFT_OPERATOR',
    operationsManager: 'OPERATIONS_MANAGER',
    admin: 'ADMIN',
} as const;

export type AppRole = (typeof roles)[keyof typeof roles];

export const normalizeRole = (role: string): string => role.trim().replace(/^ROLE_/i, '').toUpperCase();

export const hasAnyRole = (user: Pick<AuthUser, 'roles'> | null | undefined, allowedRoles: readonly string[]): boolean => {
    if (!user || allowedRoles.length === 0) {
        return false;
    }

    const normalizedAllowedRoles = new Set(allowedRoles.map(normalizeRole));

    return user.roles.some((role) => normalizedAllowedRoles.has(normalizeRole(role)));
};

export const isAircraftOperator = (user: Pick<AuthUser, 'roles'> | null | undefined): boolean =>
    hasAnyRole(user, [roles.aircraftOperator]);

export const isOperationsManager = (user: Pick<AuthUser, 'roles'> | null | undefined): boolean =>
    hasAnyRole(user, [roles.operationsManager]);

export const isAdmin = (user: Pick<AuthUser, 'roles'> | null | undefined): boolean => hasAnyRole(user, [roles.admin]);
