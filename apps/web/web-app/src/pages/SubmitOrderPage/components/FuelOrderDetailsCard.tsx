import { Card, CardBody } from '@fuel-pass/ui';

import { FuelOrderForm } from '../../../features/fuel-orders';
import styles from '../SubmitOrderPage.module.css';

export const FuelOrderDetailsCard = () => (
    <Card className={styles.orderCard}>
        <CardBody className={styles.orderCardBody}>
            <div className={styles.orderCardHeader}>
                <h2>Fuel order details</h2>
                <p>Enter the aircraft, airport, fuel volume, and delivery time window.</p>
            </div>
            <FuelOrderForm />
        </CardBody>
    </Card>
);
