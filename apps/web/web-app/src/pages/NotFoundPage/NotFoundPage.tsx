import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../features/auth/store/auth.store';
import { getWorkspaceRouteForUser, routes } from '../../routes/roleRoutes';
import { NotFoundBrand } from './components/NotFoundBrand';
import { NotFoundCard } from './components/NotFoundCard';
import { NotFoundFooter } from './components/NotFoundFooter';
import styles from './NotFoundPage.module.css';

export const NotFoundPage = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const workspaceRoute = user ? getWorkspaceRouteForUser(user) : null;
    const fallbackRoute = isAuthenticated ? (workspaceRoute ?? routes.restricted) : routes.login;

    return (
        <div className={styles.page}>
            <NotFoundBrand />

            <main className={styles.main}>
                <NotFoundCard
                    onBackToLogin={() => navigate(routes.login, { replace: true })}
                    onGoToWorkspace={() => navigate(fallbackRoute, { replace: true })}
                />
            </main>

            <NotFoundFooter />
        </div>
    );
};
