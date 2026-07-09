import { Card, CardBody, CardHeader } from '@fuel-pass/ui';
import {
    formatDateTime,
    type FuelOrder,
    type FuelOrderStatus,
    type FuelOrderUser,
    getFuelOrderStatusLabel,
} from '../../../features/fuel-orders';
import styles from '../OrderDetailsPage.module.css';

const getActorLabel = (user: FuelOrderUser | undefined, userId: string | null | undefined): string => {
    if (user !== undefined) {
        return user.fullName ? `${user.fullName} (${user.email})` : user.email;
    }

    return userId ?? 'Unknown user';
};

const getDefaultHistoryNote = (fromStatus: FuelOrderStatus | null, toStatus: FuelOrderStatus): string => {
    if (fromStatus === null) {
        return 'Fuel order was submitted.';
    }

    return `Order moved from ${getFuelOrderStatusLabel(fromStatus)} to ${getFuelOrderStatusLabel(toStatus)}.`;
};

export const StatusHistoryCard = ({ order }: { order: FuelOrder }) => {
    const history = order.statusHistory ?? [];

    return (
        <Card className={styles.card}>
            <CardHeader>
                <h2>Status history</h2>
            </CardHeader>
            <CardBody>
                {history.length === 0 ? (
                    <p className={styles.emptyText}>No status history has been recorded for this order yet.</p>
                ) : (
                    <ol className={styles.timeline}>
                        {history.map((entry) => (
                            <li key={entry.id} className={entry.toStatus === order.status ? styles.currentTimelineItem : undefined}>
                                <div className={styles.timelineHeader}>
                                    <strong>{getFuelOrderStatusLabel(entry.toStatus)}</strong>
                                    {entry.toStatus === order.status ? <span>Current</span> : null}
                                    <time>{formatDateTime(entry.changedAt)}</time>
                                </div>
                                <p>{entry.note ?? getDefaultHistoryNote(entry.fromStatus, entry.toStatus)}</p>
                                <small>Changed by {getActorLabel(entry.changedByUser, entry.changedByUserId)}</small>
                            </li>
                        ))}
                    </ol>
                )}
            </CardBody>
        </Card>
    );
};
