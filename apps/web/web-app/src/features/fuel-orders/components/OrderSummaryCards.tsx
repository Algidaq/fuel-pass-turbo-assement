import { Card, CardBody } from '@fuel-pass/ui';

import type { FuelOrder, FuelOrderStatus } from '../types/fuelOrder.types';

type OrderSummaryCardsProps = {
  orders: FuelOrder[];
};

const countOrdersByStatus = (orders: FuelOrder[], status: FuelOrderStatus): number =>
  orders.filter((order) => order.status === status).length;

export const OrderSummaryCards = ({ orders }: OrderSummaryCardsProps) => {
  const summaryItems = [
    { label: 'Total Orders', value: orders.length },
    { label: 'Pending', value: countOrdersByStatus(orders, 'PENDING') },
    { label: 'Confirmed', value: countOrdersByStatus(orders, 'CONFIRMED') },
    { label: 'Completed', value: countOrdersByStatus(orders, 'COMPLETED') },
  ];

  return (
    <div className="order-summary-grid" aria-label="Fuel order summary">
      {summaryItems.map((item) => (
        <Card className="order-summary-card" key={item.label}>
          <CardBody className="order-summary-card-body">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
