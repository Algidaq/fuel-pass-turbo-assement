import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../features/auth/store/auth.store';
import { getDefaultRouteForUser } from './roleRoutes';

type PublicRouteProps = {
  children: ReactNode;
};

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) {
    return <div className="route-status">Loading...</div>;
  }

  if (isAuthenticated && user) {
    return <Navigate replace to={getDefaultRouteForUser(user)} />;
  }

  return children;
};
