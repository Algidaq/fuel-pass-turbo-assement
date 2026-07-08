import { ORDER_PERMISSIONS, type PermissionKey } from '@fuel-pass/contracts';
import type { AuthUser } from '../features/auth/types/auth.types';
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../features/auth/utils/permissionAccess';

export const routes = {
    login: '/login',
    orders: '/orders',
    orderDetails: '/orders/:orderId',
    restricted: '/restricted',
    submitOrder: '/orders/new',
} as const;

export const routeRequiredPermissions = {
    [routes.orders]: [ORDER_PERMISSIONS.fuelOrderReadAll.key],
    [routes.orderDetails]: [ORDER_PERMISSIONS.fuelOrderReadAll.key],
    [routes.submitOrder]: [ORDER_PERMISSIONS.fuelOrderCreate.key],
} as const;

export const hasUserPermission = (user: AuthUser | null, permission: PermissionKey): boolean => hasPermission(user, permission);

export const getWorkspaceRouteForUser = (user: AuthUser): string | null => {
    if (hasPermission(user, ORDER_PERMISSIONS.fuelOrderReadAll.key)) {
        return routes.orders;
    }

    if (hasPermission(user, ORDER_PERMISSIONS.fuelOrderCreate.key)) {
        return routes.submitOrder;
    }

    return null;
};

export const getDefaultRouteForUser = (user: AuthUser): string => {
    return getWorkspaceRouteForUser(user) ?? routes.restricted;
};

export const isRouteAllowedForUser = (path: string, user: AuthUser): boolean => {
    const requiredPermissions = routeRequiredPermissions[path as keyof typeof routeRequiredPermissions];

    if (requiredPermissions) {
        return hasAllPermissions(user, requiredPermissions);
    }

    return path === routes.restricted;
};

export const canViewOrders = (user: AuthUser | null | undefined): boolean =>
    hasAnyPermission(user, [ORDER_PERMISSIONS.fuelOrderReadAll.key]);

export const canCreateOrders = (user: AuthUser | null | undefined): boolean =>
    hasAnyPermission(user, [ORDER_PERMISSIONS.fuelOrderCreate.key]);
