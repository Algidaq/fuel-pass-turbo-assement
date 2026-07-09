import { Button } from '@fuel-pass/ui';
import { Link, useParams } from 'react-router-dom';

import { PageError } from '../../components/feedback/PageError';
import { PageLoader } from '../../components/feedback/PageLoader';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { formatDateTime, useFuelOrder, type FuelOrder, type FuelOrderUser } from '../../features/fuel-orders';
import { canUpdateOrderStatus } from '../../routes/roleRoutes';
import { getApiErrorMessage } from '../../services/apiErrorMessages';
import styles from './OrderDetailsPage.module.css';
import { CurrentStatusCard } from './components/CurrentStatusCard';
import { OrderDetailsGrid } from './components/OrderDetailGrid';
import { StatusHistoryCard } from './components/StatusHistoryCard';
import { WorkflowProgressionCard } from './components/WorkflowProgressionCard';

const getDetailsErrorMessage = (error: unknown): string => {
    return getApiErrorMessage(error, 'Unable to load this fuel order. Please try again.');
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
                    <OrderDetailsGrid order={order} createdBy={getInitialHistoryActor(order)} />
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
