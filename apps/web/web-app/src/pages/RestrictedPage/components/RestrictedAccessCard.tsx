import { Badge, Button, Card, CardBody } from '@fuel-pass/ui';

import styles from '../RestrictedPage.module.css';

type RestrictedAccessCardProps = {
    accessLabel: string;
    hasWorkspaceRoute: boolean;
    onGoToWorkspace: () => void;
    onLogout: () => void;
};

export const RestrictedAccessCard = ({ accessLabel, hasWorkspaceRoute, onGoToWorkspace, onLogout }: RestrictedAccessCardProps) => (
    <Card className={styles.card}>
        <CardBody className={styles.body}>
            <div className={styles.icon} aria-hidden="true" />

            <div className={styles.copy}>
                <h1 id="restricted-page-title">Access restricted</h1>
                <p>You do not have permission to view this page with your current role.</p>
                <p>
                    {hasWorkspaceRoute
                        ? 'Return to your assigned workspace or sign out and use a different account.'
                        : 'No FuelPass workspace is assigned to your current account.'}
                </p>
            </div>

            <div className={styles.divider} />

            <div className={styles.accessRow}>
                <span>Current access</span>
                <Badge variant="neutral">{accessLabel}</Badge>
            </div>

            <div className={styles.actions}>
                {hasWorkspaceRoute ? (
                    <Button onClick={onGoToWorkspace} type="button">
                        Go to my workspace
                    </Button>
                ) : null}
                <Button onClick={onLogout} type="button" variant={hasWorkspaceRoute ? 'secondary' : 'primary'}>
                    Logout
                </Button>
            </div>

            <p className={styles.note}>Access is based on your FuelPass role.</p>
        </CardBody>
    </Card>
);
