import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuthStore } from '../../features/auth/store/auth.store';
import type { AuthUser } from '../../features/auth/types/auth.types';
import { getPrimaryRoleLabel } from '../../features/auth/utils/userDisplay';
import { getApiErrorMessage } from '../../services/apiErrorMessages';
import { OrderFilters, OrderSummaryCards, useFuelOrders } from '../../features/fuel-orders';
import type { FuelOrderFilters } from '../../features/fuel-orders';
import { canCreateOrders, canViewAllOrders } from '../../routes/roleRoutes';
import { OrdersPageHeader } from './components/OrdersPageHeader';
import { OrdersQueryState } from './components/OrdersQueryState';
import styles from './OrdersPage.module.css';
import { buildOrdersSearchParams, defaultPage, getFiltersFromSearchParams } from './utils/ordersSearchParams';

const getOrdersErrorMessage = (error: unknown): string => {
    return getApiErrorMessage(error, 'Unable to load fuel orders. Please try again.');
};

const getOrdersRoleLabel = (user: AuthUser | null): string => {
    if (canViewAllOrders(user)) {
        return 'Operations Manager';
    }

    if (canCreateOrders(user)) {
        return 'Aircraft Operator';
    }

    return getPrimaryRoleLabel(user);
};

export const OrdersPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParams]);
    const user = useAuthStore((state) => state.user);
    const fuelOrdersQuery = useFuelOrders(filters);
    const ordersList = fuelOrdersQuery.data;
    const orders = ordersList?.items ?? [];
    const totalOrders = ordersList?.pagination.totalItems ?? orders.length;
    const isFiltered = Boolean(filters.airportIcaoCode);
    const roleLabel = getOrdersRoleLabel(user);
    const errorMessage = fuelOrdersQuery.error ? getOrdersErrorMessage(fuelOrdersQuery.error) : null;

    useEffect(() => {
        const nextSearchParams = buildOrdersSearchParams(filters);

        if (nextSearchParams.toString() !== searchParams.toString()) {
            setSearchParams(nextSearchParams, { replace: true });
        }
    }, [filters, searchParams, setSearchParams]);

    useEffect(() => {
        const pagination = ordersList?.pagination;

        if (!pagination) {
            return;
        }

        const lastValidPage = Math.max(pagination.totalPages, defaultPage);

        if (filters.page && filters.page > lastValidPage) {
            setSearchParams(buildOrdersSearchParams({ ...filters, page: lastValidPage }), { replace: true });
        }
    }, [filters, ordersList?.pagination, setSearchParams]);

    const updateSearchFilters = (nextFilters: FuelOrderFilters) => {
        setSearchParams(buildOrdersSearchParams(nextFilters));
    };

    const handleApplyFilters = (nextFilters: FuelOrderFilters) => {
        updateSearchFilters({
            airportIcaoCode: nextFilters.airportIcaoCode,
            page: defaultPage,
            pageSize: filters.pageSize,
        });
    };

    const handlePageChange = (page: number) => {
        updateSearchFilters({ ...filters, page });
    };

    const handlePageSizeChange = (pageSize: number) => {
        updateSearchFilters({ ...filters, page: defaultPage, pageSize });
    };

    return (
        <section className={styles.page}>
            <OrdersPageHeader
                isRefreshing={fuelOrdersQuery.isFetching}
                onRefresh={() => void fuelOrdersQuery.refetch()}
                roleLabel={roleLabel}
            />

            <OrderSummaryCards statusCounts={ordersList?.statusCounts} totalOrders={totalOrders} />

            <OrderFilters filters={filters} onApply={handleApplyFilters} />

            <OrdersQueryState
                error={fuelOrdersQuery.error}
                errorMessage={errorMessage}
                isFetching={fuelOrdersQuery.isFetching}
                isFiltered={isFiltered}
                isLoading={fuelOrdersQuery.isLoading}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onRetry={() => void fuelOrdersQuery.refetch()}
                orders={orders}
                pagination={ordersList?.pagination}
            />
        </section>
    );
};
