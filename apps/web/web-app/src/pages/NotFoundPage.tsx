import { Button, Card, CardBody } from '@fuel-pass/ui';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../features/auth/store/auth.store';
import { getWorkspaceRouteForUser, routes } from '../routes/roleRoutes';

export const NotFoundPage = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const workspaceRoute = user ? getWorkspaceRouteForUser(user) : null;
    const fallbackRoute = isAuthenticated ? (workspaceRoute ?? routes.restricted) : routes.login;

    return (
        <div className="not-found-page">
            <header className="not-found-brand" aria-label="FuelPass">
                <span className="not-found-brand-mark" aria-hidden="true">
                    F
                </span>
                <span>FuelPass</span>
            </header>

            <main className="not-found-main">
                <Card className="not-found-card">
                    <CardBody className="not-found-card-body">
                        <span className="not-found-icon" aria-hidden="true">
                            ?
                        </span>
                        <div className="not-found-code" aria-hidden="true">
                            404
                        </div>
                        <div className="not-found-copy">
                            <h1>Page not found</h1>
                            <p>The page you are looking for does not exist or may have been moved.</p>
                            <p>Return to your workspace or sign in again to continue.</p>
                        </div>
                        <div className="not-found-actions">
                            <Button onClick={() => navigate(fallbackRoute, { replace: true })} type="button">
                                Go to workspace
                            </Button>
                            <Button onClick={() => navigate(routes.login, { replace: true })} type="button" variant="secondary">
                                Back to login
                            </Button>
                        </div>
                        <p className="not-found-note">If the issue continues, check the route or contact your administrator.</p>
                    </CardBody>
                </Card>
            </main>

            <footer className="not-found-footer">FuelPass Operations Platform</footer>
        </div>
    );
};
