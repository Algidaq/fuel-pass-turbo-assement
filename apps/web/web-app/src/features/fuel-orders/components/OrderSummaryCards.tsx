import { Card, CardBody } from '@fuel-pass/ui';

import type { FuelOrderStatusCounts } from '../types/fuelOrder.types';
import styles from './OrderSummaryCards.module.css';

type OrderSummaryCardsProps = {
  statusCounts?: FuelOrderStatusCounts;
  totalOrders: number;
};

export const OrderSummaryCards = ({ statusCounts, totalOrders }: OrderSummaryCardsProps) => {
  const summaryItems = [
    { description: 'All submitted requests', label: 'Total Orders', value: totalOrders },
    { description: 'Awaiting confirmation', label: 'Pending', status: 'pending', value: statusCounts?.PENDING ?? 0 },
    { description: 'Scheduled for fueling', label: 'Confirmed', status: 'confirmed', value: statusCounts?.CONFIRMED ?? 0 },
    { description: 'Fueling completed', label: 'Completed', status: 'completed', value: statusCounts?.COMPLETED ?? 0 },
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
