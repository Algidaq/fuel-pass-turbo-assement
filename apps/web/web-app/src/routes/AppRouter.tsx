import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OrdersPage } from '../pages/OrdersPage';
import { SubmitOrderPage } from '../pages/SubmitOrderPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { routes } from './roleRoutes';

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
            <LoginPage />
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
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.submitOrder,
        element: (
          <ProtectedRoute routePath={routes.submitOrder}>
            <SubmitOrderPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
