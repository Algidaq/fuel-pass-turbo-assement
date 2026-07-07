import { Card } from '@fuel-pass/ui';
import { useLocation, useNavigate } from 'react-router-dom';

import { LoginForm, useLogin } from '../../features/auth';
import { getRedirectPathAfterLogin } from '../../features/auth/utils/authRedirect';
import type { LoginRequest } from '../../features/auth/types/auth.types';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = async (request: LoginRequest) => {
    const session = await login.mutateAsync(request);
    const redirectPath = getRedirectPathAfterLogin(session.user, location.state);

    navigate(redirectPath, { replace: true });
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h1>Sign in to FuelPass</h1>
        <p>Access fuel order operations and aircraft refueling workflows.</p>
      </div>
      <LoginForm error={login.error} isSubmitting={login.isPending} onSubmit={handleSubmit} />
      <p className={styles.helper}>Use your assigned FuelPass account credentials.</p>
    </Card>
  );
};
