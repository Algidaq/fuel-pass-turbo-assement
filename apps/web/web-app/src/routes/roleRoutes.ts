import type { AuthUser } from '../features/auth/types/auth.types';
import {
  hasAnyRole,
  isAdmin,
  isAircraftOperator,
  isOperationsManager,
  roles,
} from '../features/auth/utils/roleAccess';

export const routes = {
  login: '/login',
  orders: '/orders',
  submitOrder: '/orders/new',
} as const;

export const routeAllowedRoles = {
  [routes.orders]: [roles.operationsManager, roles.admin],
  [routes.submitOrder]: [roles.aircraftOperator, roles.admin],
} as const;

export const hasUserRole = (user: AuthUser | null, role: string): boolean => hasAnyRole(user, [role]);

export const getDefaultRouteForUser = (user: AuthUser): string => {
  if (isAdmin(user) || isOperationsManager(user)) {
    return routes.orders;
  }

  if (isAircraftOperator(user)) {
    return routes.submitOrder;
  }

  return routes.orders;
};

export const isRouteAllowedForUser = (path: string, user: AuthUser): boolean => {
  const allowedRoles = routeAllowedRoles[path as keyof typeof routeAllowedRoles];

  return allowedRoles ? hasAnyRole(user, allowedRoles) : path === routes.orders;
};
