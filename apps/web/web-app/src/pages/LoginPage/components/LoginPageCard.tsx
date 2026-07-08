import { Alert, Card } from '@fuel-pass/ui';

import { LoginForm } from '../../../features/auth';
import type { LoginRequest } from '../../../features/auth/types/auth.types';
import styles from '../LoginPage.module.css';

type LoginPageCardProps = {
    error: unknown;
    hasSessionExpired: boolean;
    isSubmitting: boolean;
    onSubmit: (request: LoginRequest) => Promise<void>;
};

export const LoginPageCard = ({ error, hasSessionExpired, isSubmitting, onSubmit }: LoginPageCardProps) => (
    <Card className={styles.card}>
        <div className={styles.header}>
            <h1>Sign in to FuelPass</h1>
            <p>Access fuel order operations and aircraft refueling workflows.</p>
        </div>
        {hasSessionExpired ? (
            <Alert role="alert" variant="warning">
                Your session expired. Please sign in again.
            </Alert>
        ) : null}
        <LoginForm error={error} isSubmitting={isSubmitting} onSubmit={onSubmit} />
        <p className={styles.helper}>Use your assigned FuelPass account credentials.</p>
    </Card>
);
