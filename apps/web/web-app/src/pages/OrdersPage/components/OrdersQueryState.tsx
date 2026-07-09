import { PageError } from '../../../components/feedback/PageError';
import { PageLoader } from '../../../components/feedback/PageLoader';
import { OrdersEmptyState, OrdersTable, type FuelOrder, type FuelOrdersList } from '../../../features/fuel-orders';
import styles from '../OrdersPage.module.css';

type OrdersQueryStateProps = {
    error: unknown;
    errorMessage: string | null;
    isFetching: boolean;
    isFiltered: boolean;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    onRetry: () => void;
    orders: FuelOrder[];
    pagination: FuelOrdersList['pagination'] | undefined;
};

export const OrdersQueryState = ({
    error,
    errorMessage,
    isFetching,
    isFiltered,
    isLoading,
    onPageChange,
    onPageSizeChange,
    onRetry,
    orders,
    pagination,
}: OrdersQueryStateProps) => (
    <>
        {isLoading ? <PageLoader className={styles.loader} message="Loading fuel orders..." /> : null}

        {error ? <PageError message={errorMessage ?? 'Unable to load fuel orders. Please try again.'} onRetry={onRetry} /> : null}

        {!isLoading && !error && orders.length === 0 ? <OrdersEmptyState isFiltered={isFiltered} /> : null}

        {!isLoading && !error && orders.length > 0 && pagination ? (
            <OrdersTable
                isFetching={isFetching}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                orders={orders}
                pagination={pagination}
            />
        ) : null}
    </>
);
