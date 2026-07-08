import { Badge, Button } from '@fuel-pass/ui';
import { useState } from 'react';

import { PageError } from '../../components/feedback/PageError';
import { PageLoader } from '../../components/feedback/PageLoader';
import { useAuthStore } from '../../features/auth/store/auth.store';
import type { AuthUser } from '../../features/auth/types/auth.types';
import { getApiErrorMessage } from '../../services/apiErrorMessages';
import { OrderFilters, OrderSummaryCards, OrdersEmptyState, OrdersTable, useFuelOrders } from '../../features/fuel-orders';
import type { FuelOrderFilters } from '../../features/fuel-orders';
import { canCreateOrders, canViewOrders } from '../../routes/roleRoutes';
import styles from './OrdersPage.module.css';

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
  if (canViewOrders(user)) {
    return 'Operations Manager';
  }

  if (canCreateOrders(user)) {
    return 'Aircraft Operator';
  }

  return user?.roles[0] ? formatRoleName(user.roles[0]) : 'User';
};

export const OrdersPage = () => {
  const [filters, setFilters] = useState<FuelOrderFilters>({});
  const user = useAuthStore((state) => state.user);
  const fuelOrdersQuery = useFuelOrders(filters);
  const ordersList = fuelOrdersQuery.data;
  const orders = ordersList?.items ?? [];
  const totalOrders = ordersList?.pagination.totalItems ?? orders.length;
  const isFiltered = Boolean(filters.airportIcaoCode);
  const roleLabel = getOrdersRoleLabel(user);

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
        <Button
          disabled={fuelOrdersQuery.isFetching}
          onClick={() => void fuelOrdersQuery.refetch()}
          type="button"
          variant="secondary"
        >
          <span aria-hidden="true">↻</span>
          {fuelOrdersQuery.isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </header>

      <OrderSummaryCards statusCounts={ordersList?.statusCounts} totalOrders={totalOrders} />

      <OrderFilters filters={filters} onApply={setFilters} />

      {fuelOrdersQuery.isLoading ? <PageLoader className={styles.loader} message="Loading fuel orders..." /> : null}

      {fuelOrdersQuery.error ? (
        <PageError message={getOrdersErrorMessage(fuelOrdersQuery.error)} onRetry={() => void fuelOrdersQuery.refetch()} />
      ) : null}

      {!fuelOrdersQuery.isLoading && !fuelOrdersQuery.error && orders.length === 0 ? <OrdersEmptyState isFiltered={isFiltered} /> : null}

      {!fuelOrdersQuery.isLoading && !fuelOrdersQuery.error && orders.length > 0 ? <OrdersTable orders={orders} /> : null}
    </section>
  );
};
