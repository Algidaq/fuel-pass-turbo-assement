import { EmptyState } from '../../../components/feedback/EmptyState';

type OrdersEmptyStateProps = {
  isFiltered: boolean;
};

export const OrdersEmptyState = ({ isFiltered }: OrdersEmptyStateProps) => (
  <EmptyState
    description={isFiltered ? 'No fuel orders match this airport filter.' : 'Submitted fuel orders will appear here.'}
    title="No fuel orders found."
  />
);
