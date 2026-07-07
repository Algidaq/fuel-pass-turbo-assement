import type { AuthUser } from '../features/auth/types/auth.types';

export const routes = {
  login: '/login',
  orders: '/orders',
  submitOrder: '/orders/new',
} as const;

const normalizeRole = (role: string): string => role.trim().replace(/^ROLE_/i, '').toLowerCase();

export const hasUserRole = (user: AuthUser | null, role: string): boolean =>
  Boolean(user?.roles.some((userRole) => normalizeRole(userRole) === normalizeRole(role)));

export const getDefaultRouteForUser = (user: AuthUser): string => {
  if (hasUserRole(user, 'admin') || hasUserRole(user, 'operations_manager')) {
    return routes.orders;
  }

  if (hasUserRole(user, 'aircraft_operator')) {
    return routes.submitOrder;
  }

  return routes.orders;
};

export const isRouteAllowedForUser = (path: string, user: AuthUser): boolean => {
  if (hasUserRole(user, 'admin')) {
    return path === routes.orders || path === routes.submitOrder;
  }

  if (hasUserRole(user, 'operations_manager')) {
    return path === routes.orders;
  }

  if (hasUserRole(user, 'aircraft_operator')) {
    return path === routes.submitOrder;
  }

  return path === routes.orders;
};
