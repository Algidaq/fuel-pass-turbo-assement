import { Alert, Button, Card, CardBody, CardHeader, StatusChip } from '@fuel-pass/ui';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import { PageError } from '../../components/feedback/PageError';
import { PageLoader } from '../../components/feedback/PageLoader';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { getApiErrorMessage } from '../../services/apiErrorMessages';
import {
    formatDateTime,
    formatDeliveryWindow,
    formatFuelVolume,
    getFuelOrderStatusLabel,
    getNextFuelOrderStatus,
    getStatusActionLabel,
    getStatusChipVariant,
    useFuelOrder,
    useUpdateFuelOrderStatus,
    type FuelOrder,
    type FuelOrderStatus,
    type FuelOrderUser,
} from '../../features/fuel-orders';
import { canUpdateOrderStatus } from '../../routes/roleRoutes';
import styles from './OrderDetailsPage.module.css';

const workflowStatuses: FuelOrderStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];

const getDetailsErrorMessage = (error: unknown): string => {
    return getApiErrorMessage(error, 'Unable to load this fuel order. Please try again.');
};

const getUpdateErrorMessage = (error: unknown): string => {
    return getApiErrorMessage(error, 'Unable to update this order status. Please try again.');
};

const getActorLabel = (user: FuelOrderUser | undefined, userId: string | null | undefined): string => {
    if (user !== undefined) {
        return user.fullName ? `${user.fullName} (${user.email})` : user.email;
    }

    return userId ?? 'Not recorded';
};

const getInitialHistoryActor = (order: FuelOrder): string => {
    const initialEntry = order.statusHistory?.find((entry) => entry.toStatus === 'PENDING');

    return getActorLabel(initialEntry?.changedByUser, initialEntry?.changedByUserId);
};

const getNextActionDescription = (status: FuelOrderStatus): string => {
    if (status === 'PENDING') {
        return 'Confirm this order once the fueling schedule has been reviewed.';
    }

    if (status === 'CONFIRMED') {
        return 'Mark this order as completed once the fueling operation has concluded.';
    }

    return 'This order has completed the operational workflow.';
};

const OrderDetailsGrid = ({ order }: { order: FuelOrder }) => {
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
                        <dd>{getInitialHistoryActor(order)}</dd>
                    </div>
                </dl>
            </CardBody>
        </Card>
    );
};

const StatusHistoryCard = ({ order }: { order: FuelOrder }) => {
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

const getDefaultHistoryNote = (fromStatus: FuelOrderStatus | null, toStatus: FuelOrderStatus): string => {
    if (fromStatus === null) {
        return 'Fuel order was submitted.';
    }

    return `Order moved from ${getFuelOrderStatusLabel(fromStatus)} to ${getFuelOrderStatusLabel(toStatus)}.`;
};

const CurrentStatusCard = ({ order }: { order: FuelOrder }) => {
    const updateFuelOrderStatus = useUpdateFuelOrderStatus();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const nextStatus = getNextFuelOrderStatus(order.status);
    const actionLabel = getStatusActionLabel(order.status);

    const handleStatusUpdate = async () => {
        if (!nextStatus) {
            return;
        }

        setErrorMessage(null);

        try {
            await updateFuelOrderStatus.mutateAsync({ id: order.id, status: nextStatus });
        } catch (error: unknown) {
            setErrorMessage(getUpdateErrorMessage(error));
        }
    };

    return (
        <Card className={styles.card}>
            <CardBody className={styles.statusCardBody}>
                <div className={styles.statusHeader}>
                    <h2>Current status</h2>
                    <StatusChip label={getFuelOrderStatusLabel(order.status)} variant={getStatusChipVariant(order.status)} />
                </div>
                <p>{getNextActionDescription(order.status)}</p>
                <div className={styles.nextAction}>
                    <h3>Next action</h3>
                    {nextStatus && actionLabel ? (
                        <>
                            <p>
                                Allowed transition: {getFuelOrderStatusLabel(order.status)} to {getFuelOrderStatusLabel(nextStatus)}.
                            </p>
                            <Button disabled={updateFuelOrderStatus.isPending} onClick={handleStatusUpdate} type="button">
                                {updateFuelOrderStatus.isPending ? 'Updating...' : actionLabel}
                            </Button>
                        </>
                    ) : (
                        <p>No further transitions are available.</p>
                    )}
                </div>
                {errorMessage ? (
                    <Alert className={styles.updateError} role="alert" variant="danger">
                        {errorMessage}
                    </Alert>
                ) : null}
            </CardBody>
        </Card>
    );
};

const WorkflowProgressionCard = ({ order }: { order: FuelOrder }) => {
    const currentIndex = workflowStatuses.indexOf(order.status);
    const nextStatus = getNextFuelOrderStatus(order.status);

    return (
        <Card className={styles.card}>
            <CardHeader>
                <h2>Workflow progression</h2>
            </CardHeader>
            <CardBody>
                <div className={styles.workflow} aria-label="Order status workflow">
                    {workflowStatuses.map((status, index) => {
                        const isComplete = index < currentIndex;
                        const isCurrent = status === order.status;

                        return (
                            <div
                                className={styles.workflowStep}
                                data-state={isCurrent ? 'current' : isComplete ? 'complete' : 'pending'}
                                key={status}
                            >
                                <span>{isComplete ? 'OK' : index + 1}</span>
                                <strong>{getFuelOrderStatusLabel(status)}</strong>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.transitionMap}>
                    <p>Transition Map</p>
                    <ul>
                        <li data-state={currentIndex > 0 ? 'complete' : nextStatus === 'CONFIRMED' ? 'current' : 'pending'}>
                            Pending to Confirmed
                        </li>
                        <li data-state={currentIndex > 1 ? 'complete' : nextStatus === 'COMPLETED' ? 'current' : 'pending'}>
                            Confirmed to Completed
                        </li>
                    </ul>
                </div>
            </CardBody>
        </Card>
    );
};

export const OrderDetailsPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const user = useAuthStore((state) => state.user);
    const fuelOrderQuery = useFuelOrder(orderId);
    const order = fuelOrderQuery.data;
    const canUpdateStatus = canUpdateOrderStatus(user);

    if (!orderId) {
        return <PageError message="Order ID is missing from the route." />;
    }

    if (fuelOrderQuery.isLoading) {
        return <PageLoader className={styles.loader} message="Loading fuel order..." />;
    }

    if (fuelOrderQuery.error) {
        return <PageError message={getDetailsErrorMessage(fuelOrderQuery.error)} onRetry={() => void fuelOrderQuery.refetch()} />;
    }

    if (!order) {
        return <PageError message="Fuel order was not found." onRetry={() => void fuelOrderQuery.refetch()} />;
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <Link className={styles.backLink} to="/orders">
                    Back to orders
                </Link>
                <div className={styles.headerContent}>
                    <div>
                        <h1>Order {order.id}</h1>
                        <p>Review fuel order details and operational status progression.</p>
                        <div className={styles.meta}>
                            <span>Created {formatDateTime(order.createdAt)}</span>
                            <span>Airport {order.airportIcaoCode}</span>
                        </div>
                    </div>
                    <Button
                        disabled={fuelOrderQuery.isFetching}
                        onClick={() => void fuelOrderQuery.refetch()}
                        type="button"
                        variant="secondary"
                    >
                        {fuelOrderQuery.isFetching ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </header>

            <div className={styles.layout}>
                <div className={styles.mainColumn}>
                    <OrderDetailsGrid order={order} />
                    <StatusHistoryCard order={order} />
                </div>
                <aside className={styles.sideColumn}>
                    {canUpdateStatus ? <CurrentStatusCard order={order} /> : null}
                    <WorkflowProgressionCard order={order} />
                </aside>
            </div>
        </section>
    );
};
