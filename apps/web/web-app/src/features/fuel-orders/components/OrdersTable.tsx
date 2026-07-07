import { Card, CardBody, StatusChip, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@fuel-pass/ui';

import type { FuelOrder } from '../types/fuelOrder.types';
import { formatDateTime, formatDeliveryWindow, formatFuelVolume } from '../utils/fuelOrderFormatting';
import { getFuelOrderStatusLabel, getStatusChipVariant } from '../utils/fuelOrderStatus';
import { OrderStatusActions } from './OrderStatusActions';
import styles from './OrdersTable.module.css';

type OrdersTableProps = {
  orders: FuelOrder[];
};

export const OrdersTable = ({ orders }: OrdersTableProps) => (
  <Card className={styles.card}>
    <div className={styles.header}>
      <h2>Submitted orders</h2>
      <p>Review requests and move orders through the operational workflow.</p>
    </div>
    <CardBody className={styles.body}>
      <div className={styles.scroll}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tail Number</TableHead>
              <TableHead>Airport</TableHead>
              <TableHead>Requested Volume</TableHead>
              <TableHead>Delivery Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className={styles.actionsHead}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.tailNumber}</TableCell>
                <TableCell>{order.airportIcaoCode}</TableCell>
                <TableCell>{formatFuelVolume(order)}</TableCell>
                <TableCell>{formatDeliveryWindow(order)}</TableCell>
                <TableCell>
                  <StatusChip label={getFuelOrderStatusLabel(order.status)} variant={getStatusChipVariant(order.status)} />
                </TableCell>
                <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                <TableCell className={styles.actionsCell}>
                  <OrderStatusActions order={order} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardBody>
    <div className={styles.footer}>
      <span>
        Showing {orders.length} of {orders.length} {orders.length === 1 ? 'order' : 'orders'}
      </span>
    </div>
  </Card>
);
