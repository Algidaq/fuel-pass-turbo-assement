import type { AuthUser } from '../types/auth.types';

export const formatRoleName = (role: string): string =>
    role
        .split(/[_\s-]+/u)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

export const getPrimaryRoleLabel = (user: AuthUser | null, fallback = 'User'): string => {
    return user?.roles[0] ? formatRoleName(user.roles[0]) : fallback;
};
