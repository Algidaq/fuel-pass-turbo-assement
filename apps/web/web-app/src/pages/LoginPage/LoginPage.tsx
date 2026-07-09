import { useLocation, useNavigate } from 'react-router-dom';

import { useLogin } from '../../features/auth';
import { getRedirectPathAfterLogin } from '../../features/auth/utils/authRedirect';
import type { LoginRequest } from '../../features/auth/types/auth.types';
import { LoginPageCard } from './components/LoginPageCard';

type LoginLocationState = {
    sessionExpired?: boolean;
};

export const LoginPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const login = useLogin();
    const locationState = location.state as LoginLocationState | null;
    const hasSessionExpired = locationState?.sessionExpired === true;

    const handleSubmit = async (request: LoginRequest) => {
        const session = await login.mutateAsync(request);
        const redirectPath = getRedirectPathAfterLogin(session.user, location.state);

        navigate(redirectPath, { replace: true });
    };

    return (
        <LoginPageCard error={login.error} hasSessionExpired={hasSessionExpired} isSubmitting={login.isPending} onSubmit={handleSubmit} />
    );
};
