import { Badge, Button } from '@fuel-pass/ui';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageError } from '../../components/feedback/PageError';
import { PageLoader } from '../../components/feedback/PageLoader';
import { useAuthStore } from '../../features/auth/store/auth.store';
import type { AuthUser } from '../../features/auth/types/auth.types';
import { getApiErrorMessage } from '../../services/apiErrorMessages';
import { fuelOrderPageSizeOptions, OrderFilters, OrderSummaryCards, OrdersEmptyState, OrdersTable, useFuelOrders } from '../../features/fuel-orders';
import type { FuelOrderFilters } from '../../features/fuel-orders';
import { canCreateOrders, canViewAllOrders } from '../../routes/roleRoutes';
import styles from './OrdersPage.module.css';

const defaultPage = 1;
const defaultPageSize = 20;

const getOrdersErrorMessage = (error: unknown): string => {
    return getApiErrorMessage(error, 'Unable to load fuel orders. Please try again.');
};

const formatRoleName = (role: string): string =>
    role
        .split(/[_\s-]+/u)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

const getOrdersRoleLabel = (user: AuthUser | null): string => {
    if (canViewAllOrders(user)) {
        return 'Operations Manager';
    }

    if (canCreateOrders(user)) {
        return 'Aircraft Operator';
    }

    return user?.roles[0] ? formatRoleName(user.roles[0]) : 'User';
};

const parsePositiveInteger = (value: string | null, fallback: number): number => {
    if (!value) {
        return fallback;
    }

    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue >= 1 ? parsedValue : fallback;
};

const parsePageSize = (value: string | null): number => {
    const parsedValue = parsePositiveInteger(value, defaultPageSize);

    return fuelOrderPageSizeOptions.includes(parsedValue as (typeof fuelOrderPageSizeOptions)[number])
        ? parsedValue
        : defaultPageSize;
};

const parseAirportIcaoCode = (value: string | null): string | undefined => {
    const normalizedValue = value?.trim().toUpperCase();

    return normalizedValue && /^[A-Z]{4}$/u.test(normalizedValue) ? normalizedValue : undefined;
};

const getFiltersFromSearchParams = (searchParams: URLSearchParams): FuelOrderFilters => ({
    airportIcaoCode: parseAirportIcaoCode(searchParams.get('airportIcaoCode')),
    page: parsePositiveInteger(searchParams.get('page'), defaultPage),
    pageSize: parsePageSize(searchParams.get('pageSize')),
});

const buildOrdersSearchParams = (filters: FuelOrderFilters): URLSearchParams => {
    const searchParams = new URLSearchParams();

    if (filters.airportIcaoCode) {
        searchParams.set('airportIcaoCode', filters.airportIcaoCode);
    }

    if (filters.page && filters.page > defaultPage) {
        searchParams.set('page', String(filters.page));
    }

    if (filters.pageSize && filters.pageSize !== defaultPageSize) {
        searchParams.set('pageSize', String(filters.pageSize));
    }

    return searchParams;
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
            <header className={styles.header}>
                <div>
                    <div className={styles.titleRow}>
                        <h1>Fuel Orders</h1>
                        <Badge variant="info">{roleLabel}</Badge>
                    </div>
                    <p>Track submitted fuel orders and update operational status.</p>
                </div>
                <Button disabled={fuelOrdersQuery.isFetching} onClick={() => void fuelOrdersQuery.refetch()} type="button" variant="secondary">
                    <span aria-hidden="true">↻</span>
                    {fuelOrdersQuery.isFetching ? 'Refreshing...' : 'Refresh'}
                </Button>
            </header>

            <OrderSummaryCards statusCounts={ordersList?.statusCounts} totalOrders={totalOrders} />

            <OrderFilters filters={filters} onApply={handleApplyFilters} />

            {fuelOrdersQuery.isLoading ? <PageLoader className={styles.loader} message="Loading fuel orders..." /> : null}

            {fuelOrdersQuery.error ? (
                <PageError message={getOrdersErrorMessage(fuelOrdersQuery.error)} onRetry={() => void fuelOrdersQuery.refetch()} />
            ) : null}

            {!fuelOrdersQuery.isLoading && !fuelOrdersQuery.error && orders.length === 0 ? <OrdersEmptyState isFiltered={isFiltered} /> : null}

            {!fuelOrdersQuery.isLoading && !fuelOrdersQuery.error && orders.length > 0 && ordersList?.pagination ? (
                <OrdersTable
                    isFetching={fuelOrdersQuery.isFetching}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    orders={orders}
                    pagination={ordersList.pagination}
                />
            ) : null}
        </section>
    );
};
