import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@fuel-pass/ui';

import { authService } from '../features/auth/services/authService';
import { useAuthStore } from '../features/auth/store/auth.store';
import { routes } from '../routes/roleRoutes';

export const AppLayout = () => {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const handleLogout = async () => {
    try {
      await authService.logout(refreshToken);
    } catch {
      // Local logout should still work if the backend session is already gone.
    } finally {
      clearSession();
      navigate(routes.login, { replace: true });
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <NavLink className="brand app-brand" to={routes.orders}>
          FuelPass
        </NavLink>
        <nav className="app-nav" aria-label="Main navigation">
          <NavLink to={routes.orders}>Orders</NavLink>
          <NavLink to={routes.submitOrder}>New Order</NavLink>
        </nav>
        <Button onClick={handleLogout} type="button" variant="ghost">
          Logout
        </Button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
