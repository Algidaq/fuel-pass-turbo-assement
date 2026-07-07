import { Badge, Button, Card, CardBody } from '@fuel-pass/ui';
import { useNavigate } from 'react-router-dom';

import { useLogout } from '../features/auth/hooks/useLogout';
import { useAuthStore } from '../features/auth/store/auth.store';
import type { AuthUser } from '../features/auth/types/auth.types';
import { getWorkspaceRouteForUser } from '../routes/roleRoutes';

const formatRoleName = (role: string): string =>
    role
        .split(/[_\s-]+/u)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

const getAccessLabel = (user: AuthUser | null): string => {
    if (!user?.roles.length) {
        return 'Role-based';
    }

    return formatRoleName(user.roles[0]);
};

export const RestrictedPage = () => {
    const logout = useLogout();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const workspaceRoute = user ? getWorkspaceRouteForUser(user) : null;

    return (
        <section className="restricted-page" aria-labelledby="restricted-page-title">
            <Card className="restricted-card">
                <CardBody className="restricted-card-body">
                    <div className="restricted-icon" aria-hidden="true" />

                    <div className="restricted-copy">
                        <h1 id="restricted-page-title">Access restricted</h1>
                        <p>You do not have permission to view this page with your current role.</p>
                        <p>
                            {workspaceRoute
                                ? 'Return to your assigned workspace or sign out and use a different account.'
                                : 'No FuelPass workspace is assigned to your current account.'}
                        </p>
                    </div>

                    <div className="restricted-divider" />

                    <div className="restricted-access-row">
                        <span>Current access</span>
                        <Badge variant="neutral">{getAccessLabel(user)}</Badge>
                    </div>

                    <div className="restricted-actions">
                        {workspaceRoute ? (
                            <Button onClick={() => navigate(workspaceRoute, { replace: true })} type="button">
                                Go to my workspace
                            </Button>
                        ) : null}
                        <Button onClick={() => void logout()} type="button" variant={workspaceRoute ? 'secondary' : 'primary'}>
                            Logout
                        </Button>
                    </div>

                    <p className="restricted-note">Access is based on your FuelPass role.</p>
                </CardBody>
            </Card>
        </section>
    );
};
