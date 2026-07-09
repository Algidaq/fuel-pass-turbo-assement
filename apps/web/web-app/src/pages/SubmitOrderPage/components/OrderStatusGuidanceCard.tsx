import { Card, CardBody } from '@fuel-pass/ui';

import styles from '../SubmitOrderPage.module.css';

export const OrderStatusGuidanceCard = () => (
    <Card className={styles.supportCard}>
        <CardBody className={styles.supportCardBody}>
            <div className={styles.supportHeadingRow}>
                <h3>Order status</h3>
                <span className={styles.pendingBadge}>Pending</span>
            </div>
            <p>
                New fuel orders are created as Pending until operations confirm scheduling. You will receive a notification once the status
                updates.
            </p>
        </CardBody>
    </Card>
);
