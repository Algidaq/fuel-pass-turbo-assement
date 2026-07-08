import { Badge } from '@fuel-pass/ui';

import styles from '../SubmitOrderPage.module.css';

export const SubmitOrderHeader = () => (
    <div className={styles.header}>
        <div className={styles.titleRow}>
            <h1>Submit Fuel Order</h1>
            <Badge variant="info">Aircraft Operator</Badge>
        </div>
        <p>
            Request aircraft refueling at a specific airport and delivery window. Ensure all data conforms to international aviation
            standards.
        </p>
    </div>
);
