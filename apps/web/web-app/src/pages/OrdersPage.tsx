import { useState } from 'react';

import { PageError } from '../components/feedback/PageError';
import { PageLoader } from '../components/feedback/PageLoader';
import { getApiErrorMessage } from '../services/apiErrorMessages';
import { OrderFilters, OrderSummaryCards, OrdersEmptyState, OrdersTable, useFuelOrders } from '../features/fuel-orders';
import type { FuelOrderFilters } from '../features/fuel-orders';

const getOrdersErrorMessage = (error: unknown): string => {
  return getApiErrorMessage(error, 'Unable to load fuel orders. Please try again.');
};

export const OrdersPage = () => {
  const [filters, setFilters] = useState<FuelOrderFilters>({});
  const fuelOrdersQuery = useFuelOrders(filters);
  const orders = fuelOrdersQuery.data ?? [];
  const isFiltered = Boolean(filters.airportIcaoCode);

  return (
    <section className="orders-page">
      <header className="page-header">
        <h1>Fuel Orders</h1>
        <p>Track submitted fuel orders and update operational status.</p>
      </header>

      <OrderSummaryCards orders={orders} />

      <OrderFilters filters={filters} onApply={setFilters} />

      {fuelOrdersQuery.isLoading ? <PageLoader message="Loading fuel orders..." /> : null}

      {fuelOrdersQuery.error ? (
        <PageError message={getOrdersErrorMessage(fuelOrdersQuery.error)} onRetry={() => void fuelOrdersQuery.refetch()} />
      ) : null}

      {!fuelOrdersQuery.isLoading && !fuelOrdersQuery.error && orders.length === 0 ? <OrdersEmptyState isFiltered={isFiltered} /> : null}

      {!fuelOrdersQuery.isLoading && !fuelOrdersQuery.error && orders.length > 0 ? <OrdersTable orders={orders} /> : null}
    </section>
  );
};
