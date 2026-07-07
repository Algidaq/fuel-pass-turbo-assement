type OrdersEmptyStateProps = {
  isFiltered: boolean;
};

export const OrdersEmptyState = ({ isFiltered }: OrdersEmptyStateProps) => (
  <div className="orders-empty-state">
    <h2>No fuel orders found.</h2>
    <p>{isFiltered ? 'No fuel orders match this airport filter.' : 'Submitted fuel orders will appear here.'}</p>
  </div>
);
