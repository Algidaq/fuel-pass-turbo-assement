import type { PermissionKey } from '@fuel-pass/contracts';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { PageError } from '../components/feedback/PageError';
import { PageLoader } from '../components/feedback/PageLoader';
import { useAuthHydration } from '../features/auth/hooks/useAuthHydration';
import { useAuthStore } from '../features/auth/store/auth.store';
import { hasAllPermissions } from '../features/auth/utils/permissionAccess';
import { getDefaultRouteForUser, routes } from './roleRoutes';

type PermissionGuardProps = {
    requiredPermissions: readonly PermissionKey[];
    children: ReactNode;
};

export const PermissionGuard = ({ requiredPermissions, children }: PermissionGuardProps) => {
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

    if (!hasAllPermissions(user, requiredPermissions)) {
        const defaultRoute = getDefaultRouteForUser(user);

        if (defaultRoute !== location.pathname) {
            return <Navigate replace to={defaultRoute} />;
        }

        return <PageError message="You do not have permission to access this page." />;
    }

    return children;
};
