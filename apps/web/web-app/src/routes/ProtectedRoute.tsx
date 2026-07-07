import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../features/auth/store/auth.store';
import { getDefaultRouteForUser, isRouteAllowedForUser, routes } from './roleRoutes';

type ProtectedRouteProps = {
  children: ReactNode;
  routePath: string;
};

export const ProtectedRoute = ({ children, routePath }: ProtectedRouteProps) => {
  const location = useLocation();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) {
    return <div className="route-status">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate replace state={{ from: location }} to={routes.login} />;
  }

  if (!isRouteAllowedForUser(routePath, user)) {
    return <Navigate replace to={getDefaultRouteForUser(user)} />;
  }

  return children;
};
