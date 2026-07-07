import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicRoute } from './PublicRoute';
import { PermissionGuard } from './PermissionGuard';
import { ProtectedRoute } from './ProtectedRoute';
import { routeRequiredPermissions, routes } from './roleRoutes';
import { PageLoader } from '../components/feedback/PageLoader';

const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const OrdersPage = lazy(() => import('../pages/OrdersPage').then((module) => ({ default: module.OrdersPage })));
const RestrictedPage = lazy(() => import('../pages/RestrictedPage').then((module) => ({ default: module.RestrictedPage })));
const SubmitOrderPage = lazy(() => import('../pages/SubmitOrderPage').then((module) => ({ default: module.SubmitOrderPage })));

const withSuspense = (children: ReactNode) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate replace to={routes.login} />,
    },
    {
        element: <AuthLayout />,
        children: [
            {
                path: routes.login,
                element: <PublicRoute>{withSuspense(<LoginPage />)}</PublicRoute>,
            },
        ],
    },
    {
        element: <AppLayout />,
        children: [
            {
                path: routes.restricted,
                element: <ProtectedRoute routePath={routes.restricted}>{withSuspense(<RestrictedPage />)}</ProtectedRoute>,
            },
            {
                path: routes.orders,
                element: (
                    <PermissionGuard requiredPermissions={routeRequiredPermissions[routes.orders]}>
                        {withSuspense(<OrdersPage />)}
                    </PermissionGuard>
                ),
            },
            {
                path: routes.submitOrder,
                element: (
                    <PermissionGuard requiredPermissions={routeRequiredPermissions[routes.submitOrder]}>
                        {withSuspense(<SubmitOrderPage />)}
                    </PermissionGuard>
                ),
            },
        ],
    },
    {
        path: '*',
        element: withSuspense(<NotFoundPage />),
    },
]);

export const AppRouter = () => <RouterProvider router={router} />;
