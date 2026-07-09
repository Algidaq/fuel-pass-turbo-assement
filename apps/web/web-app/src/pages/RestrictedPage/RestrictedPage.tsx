import { useNavigate } from 'react-router-dom';

import { useLogout } from '../../features/auth/hooks/useLogout';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { getPrimaryRoleLabel } from '../../features/auth/utils/userDisplay';
import { getWorkspaceRouteForUser } from '../../routes/roleRoutes';
import { RestrictedAccessCard } from './components/RestrictedAccessCard';
import styles from './RestrictedPage.module.css';

export const RestrictedPage = () => {
    const logout = useLogout();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const workspaceRoute = user ? getWorkspaceRouteForUser(user) : null;
    const accessLabel = getPrimaryRoleLabel(user, 'Role-based');

    return (
        <section className={styles.page} aria-labelledby="restricted-page-title">
            <RestrictedAccessCard
                accessLabel={accessLabel}
                hasWorkspaceRoute={Boolean(workspaceRoute)}
                onGoToWorkspace={() => {
                    if (workspaceRoute) {
                        navigate(workspaceRoute, { replace: true });
                    }
                }}
                onLogout={() => void logout()}
            />
        </section>
    );
};
