import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { PageLoader } from '../components/feedback/PageLoader';
import { useAuthHydration } from '../features/auth/hooks/useAuthHydration';
import { useAuthStore } from '../features/auth/store/auth.store';
import { getDefaultRouteForUser } from './roleRoutes';

type PublicRouteProps = {
  children: ReactNode;
};

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const isHydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) {
    return <PageLoader />;
  }

  if (isAuthenticated && user) {
    return <Navigate replace to={getDefaultRouteForUser(user)} />;
  }

  return children;
};
