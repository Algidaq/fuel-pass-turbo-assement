import { Card, CardBody } from '@fuel-pass/ui';

import type { FuelOrder, FuelOrderStatus } from '../types/fuelOrder.types';

type OrderSummaryCardsProps = {
  orders: FuelOrder[];
};

const countOrdersByStatus = (orders: FuelOrder[], status: FuelOrderStatus): number =>
  orders.filter((order) => order.status === status).length;

export const OrderSummaryCards = ({ orders }: OrderSummaryCardsProps) => {
  const summaryItems = [
    { description: 'All submitted requests', label: 'Total Orders', value: orders.length },
    { description: 'Awaiting confirmation', label: 'Pending', status: 'pending', value: countOrdersByStatus(orders, 'PENDING') },
    { description: 'Scheduled for fueling', label: 'Confirmed', status: 'confirmed', value: countOrdersByStatus(orders, 'CONFIRMED') },
    { description: 'Fueling completed', label: 'Completed', status: 'completed', value: countOrdersByStatus(orders, 'COMPLETED') },
  ];

  return (
    <div className="order-summary-grid" aria-label="Fuel order summary">
      {summaryItems.map((item) => (
        <Card className="order-summary-card" key={item.label}>
          <CardBody className="order-summary-card-body">
            <div className="order-summary-card-title">
              <span>{item.label}</span>
              {item.status ? <i className={`order-summary-dot ${item.status}`} aria-hidden="true" /> : null}
            </div>
            <strong>{item.value}</strong>
            <p>{item.description}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
