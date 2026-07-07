import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { PageLoader } from '../components/feedback/PageLoader';
import { useAuthHydration } from '../features/auth/hooks/useAuthHydration';
import { useAuthStore } from '../features/auth/store/auth.store';
import { hasAnyRole } from '../features/auth/utils/roleAccess';
import { getDefaultRouteForUser, routes } from './roleRoutes';

type RoleGuardProps = {
    allowedRoles: readonly string[];
    children: ReactNode;
};

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
    const location = useLocation();
    const isHydrated = useAuthHydration();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);

    if (!isHydrated) {
        return <PageLoader />;
    }

    if (!isAuthenticated || !user) {
        return <Navigate replace state={{ from: location }} to={routes.login} />;
    }

    if (!hasAnyRole(user, allowedRoles)) {
        const defaultRoute = getDefaultRouteForUser(user);

        if (defaultRoute === location.pathname) {
            return children;
        }

        return <Navigate replace to={defaultRoute} />;
    }

    return children;
};
