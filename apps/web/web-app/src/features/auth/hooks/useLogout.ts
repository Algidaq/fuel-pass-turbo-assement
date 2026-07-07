import { useNavigate } from 'react-router-dom';

import { routes } from '../../../routes/roleRoutes';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/auth.store';

export const useLogout = () => {
    const navigate = useNavigate();
    const clearSession = useAuthStore((state) => state.clearSession);
    const refreshToken = useAuthStore((state) => state.refreshToken);

    return async () => {
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
};
