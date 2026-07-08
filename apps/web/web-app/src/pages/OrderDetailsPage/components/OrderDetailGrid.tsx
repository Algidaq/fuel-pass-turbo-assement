import { Card, CardBody, CardHeader, StatusChip } from '@fuel-pass/ui';
import {
    type FuelOrder,
    formatDateTime,
    formatDeliveryWindow,
    formatFuelVolume,
    getFuelOrderStatusLabel,
    getStatusChipVariant,
} from '../../../features/fuel-orders';
import styles from '../OrderDetailsPage.module.css';

export const OrderDetailsGrid = ({ order, createdBy }: { order: FuelOrder; createdBy: string }) => {
    const detailItems = [
        ['Order ID', order.id],
        ['Tail Number', order.tailNumber],
        ['Airport ICAO Code', order.airportIcaoCode],
        ['Requested Fuel Volume', formatFuelVolume(order)],
        ['Delivery Window', formatDeliveryWindow(order)],
    ] as const;

    return (
        <Card className={styles.card}>
            <CardHeader>
                <h2>Order details</h2>
            </CardHeader>
            <CardBody>
                <dl className={styles.detailsGrid}>
                    {detailItems.map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                    <div>
                        <dt>Current Status</dt>
                        <dd>
                            <StatusChip label={getFuelOrderStatusLabel(order.status)} variant={getStatusChipVariant(order.status)} />
                        </dd>
                    </div>
                    <div className={styles.divider} />
                    <div>
                        <dt>Created At</dt>
                        <dd>{formatDateTime(order.createdAt)}</dd>
                    </div>
                    <div>
                        <dt>Created By</dt>
                        <dd>{createdBy}</dd>
                    </div>
                </dl>
            </CardBody>
        </Card>
    );
};
