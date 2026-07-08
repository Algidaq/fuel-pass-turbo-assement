import { Button, Card, CardBody } from '@fuel-pass/ui';

import styles from '../NotFoundPage.module.css';

type NotFoundCardProps = {
    onBackToLogin: () => void;
    onGoToWorkspace: () => void;
};

export const NotFoundCard = ({ onBackToLogin, onGoToWorkspace }: NotFoundCardProps) => (
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
                <Button onClick={onGoToWorkspace} type="button">
                    Go to workspace
                </Button>
                <Button onClick={onBackToLogin} type="button" variant="secondary">
                    Back to login
                </Button>
            </div>
            <p className={styles.note}>If the issue continues, check the route or contact your administrator.</p>
        </CardBody>
    </Card>
);
