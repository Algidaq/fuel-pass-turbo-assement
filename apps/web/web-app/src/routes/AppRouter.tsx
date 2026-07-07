import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { routes } from './roleRoutes';

const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const OrdersPage = lazy(() => import('../pages/OrdersPage').then((module) => ({ default: module.OrdersPage })));
const SubmitOrderPage = lazy(() => import('../pages/SubmitOrderPage').then((module) => ({ default: module.SubmitOrderPage })));

const withSuspense = (children: ReactNode) => <Suspense fallback={<div className="route-status">Loading...</div>}>{children}</Suspense>;

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
          <ProtectedRoute routePath={routes.orders}>
            {withSuspense(<OrdersPage />)}
          </ProtectedRoute>
        ),
      },
      {
        path: routes.submitOrder,
        element: (
          <ProtectedRoute routePath={routes.submitOrder}>
            {withSuspense(<SubmitOrderPage />)}
          </ProtectedRoute>
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
