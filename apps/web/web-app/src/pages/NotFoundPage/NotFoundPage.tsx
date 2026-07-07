import { Button, Card, CardBody } from '@fuel-pass/ui';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../features/auth/store/auth.store';
import { getWorkspaceRouteForUser, routes } from '../../routes/roleRoutes';
import styles from './NotFoundPage.module.css';

export const NotFoundPage = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const workspaceRoute = user ? getWorkspaceRouteForUser(user) : null;
    const fallbackRoute = isAuthenticated ? (workspaceRoute ?? routes.restricted) : routes.login;

    return (
        <div className={styles.page}>
            <header className={styles.brand} aria-label="FuelPass">
                <span className={styles.brandMark} aria-hidden="true">
                    F
                </span>
                <span>FuelPass</span>
            </header>

            <main className={styles.main}>
                <Card className={styles.card}>
                    <CardBody className={styles.body}>
                        <span className={styles.icon} aria-hidden="true">
                            ?
                        </span>
                        <div className={styles.code} aria-hidden="true">
                            404
                        </div>
                        <div className={styles.copy}>
                            <h1>Page not found</h1>
                            <p>The page you are looking for does not exist or may have been moved.</p>
                            <p>Return to your workspace or sign in again to continue.</p>
                        </div>
                        <div className={styles.actions}>
                            <Button onClick={() => navigate(fallbackRoute, { replace: true })} type="button">
                                Go to workspace
                            </Button>
                            <Button onClick={() => navigate(routes.login, { replace: true })} type="button" variant="secondary">
                                Back to login
                            </Button>
                        </div>
                        <p className={styles.note}>If the issue continues, check the route or contact your administrator.</p>
                    </CardBody>
                </Card>
            </main>

            <footer className={styles.footer}>FuelPass Operations Platform</footer>
        </div>
    );
};
