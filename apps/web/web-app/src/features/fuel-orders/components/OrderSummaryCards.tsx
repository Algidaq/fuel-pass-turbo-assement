import { Card, CardBody } from '@fuel-pass/ui';

import type { FuelOrder, FuelOrderStatus } from '../types/fuelOrder.types';
import styles from './OrderSummaryCards.module.css';

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
    <div className={styles.grid} aria-label="Fuel order summary">
      {summaryItems.map((item) => (
        <Card className={styles.card} key={item.label}>
          <CardBody className={styles.body}>
            <div className={styles.title}>
              <span>{item.label}</span>
              {item.status ? <i className={[styles.dot, styles[item.status]].join(' ')} aria-hidden="true" /> : null}
            </div>
            <strong>{item.value}</strong>
            <p>{item.description}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
