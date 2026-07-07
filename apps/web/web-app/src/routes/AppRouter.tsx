import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicRoute } from './PublicRoute';
import { RoleGuard } from './RoleGuard';
import { routeAllowedRoles, routes } from './roleRoutes';
import { PageLoader } from '../components/feedback/PageLoader';

const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const OrdersPage = lazy(() => import('../pages/OrdersPage').then((module) => ({ default: module.OrdersPage })));
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
        element: (
          <PublicRoute>
            {withSuspense(<LoginPage />)}
          </PublicRoute>
        ),
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: routes.orders,
        element: (
          <RoleGuard allowedRoles={routeAllowedRoles[routes.orders]}>
            {withSuspense(<OrdersPage />)}
          </RoleGuard>
        ),
      },
      {
        path: routes.submitOrder,
        element: (
          <RoleGuard allowedRoles={routeAllowedRoles[routes.submitOrder]}>
            {withSuspense(<SubmitOrderPage />)}
          </RoleGuard>
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
