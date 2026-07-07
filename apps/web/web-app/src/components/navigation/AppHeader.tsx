import { Button } from '@fuel-pass/ui';
import { NavLink, useNavigate } from 'react-router-dom';

import { authService } from '../../features/auth/services/authService';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { isAdmin, isAircraftOperator, isOperationsManager } from '../../features/auth/utils/roleAccess';
import { routes } from '../../routes/roleRoutes';

export const AppHeader = () => {
    const navigate = useNavigate();
    const clearSession = useAuthStore((state) => state.clearSession);
    const refreshToken = useAuthStore((state) => state.refreshToken);
    const user = useAuthStore((state) => state.user);

    const canViewOrders = isAdmin(user) || isOperationsManager(user);
    const canCreateOrders = isAdmin(user) || isAircraftOperator(user);
    const brandRoute = canCreateOrders && !canViewOrders ? routes.submitOrder : routes.orders;

    const handleLogout = async () => {
        try {
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } catch {
            // Local logout should still work if the backend session is already gone.
        } finally {
            clearSession();
            navigate(routes.login, { replace: true });
        }
    };

    return (
        <header className="app-header">
            <NavLink className="brand app-brand" to={brandRoute}>
                FuelPass
            </NavLink>
            <nav className="app-nav" aria-label="Main navigation">
                {canViewOrders ? <NavLink to={routes.orders}>Orders</NavLink> : null}
                {canCreateOrders ? <NavLink to={routes.submitOrder}>New Order</NavLink> : null}
            </nav>
            <Button onClick={handleLogout} type="button" variant="ghost">
                Logout
            </Button>
        </header>
    );
};
