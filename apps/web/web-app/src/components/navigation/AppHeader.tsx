import { Button } from '@fuel-pass/ui';
import { NavLink } from 'react-router-dom';

import { useLogout } from '../../features/auth/hooks/useLogout';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { canCreateOrders, canViewOrders as canViewOrdersForUser, getWorkspaceRouteForUser, routes } from '../../routes/roleRoutes';
import styles from './AppHeader.module.css';

export const AppHeader = () => {
    const logout = useLogout();
    const user = useAuthStore((state) => state.user);

    const canViewOrders = canViewOrdersForUser(user);
    const canCreateOrder = canCreateOrders(user);
    const brandRoute = user ? (getWorkspaceRouteForUser(user) ?? routes.restricted) : routes.login;

    return (
        <header className={styles.header}>
            <NavLink className={styles.brand} to={brandRoute}>
                FuelPass
            </NavLink>
            <nav className={styles.nav} aria-label="Main navigation">
                {canViewOrders ? <NavLink to={routes.orders}>Orders</NavLink> : null}
                {canCreateOrder ? <NavLink to={routes.submitOrder}>New Order</NavLink> : null}
            </nav>
            <Button onClick={() => void logout()} type="button" variant="ghost">
                Logout
            </Button>
        </header>
    );
};
