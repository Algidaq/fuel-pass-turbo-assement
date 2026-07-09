import {
    Button,
    Card,
    CardBody,
    Select,
    StatusChip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@fuel-pass/ui';
import { Link } from 'react-router-dom';

import { fuelOrderPageSizeOptions, type FuelOrder, type FuelOrdersList } from '../types/fuelOrder.types';
import { formatDateTime, formatDeliveryWindow, formatFuelVolume } from '../utils/fuelOrderFormatting';
import { getFuelOrderStatusLabel, getStatusChipVariant } from '../utils/fuelOrderStatus';
import { OrderStatusActions } from './OrderStatusActions';
import styles from './OrdersTable.module.css';

type OrdersTableProps = {
    isFetching: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    orders: FuelOrder[];
    pagination: FuelOrdersList['pagination'];
};

const pageSizeOptions = fuelOrderPageSizeOptions.map((pageSize) => ({
    label: String(pageSize),
    value: String(pageSize),
}));

const getRangeLabel = ({ page, pageSize, totalItems }: FuelOrdersList['pagination']): string => {
    if (totalItems === 0) {
        return 'Showing 0 orders';
    }

    const firstItem = (page - 1) * pageSize + 1;
    const lastItem = Math.min(page * pageSize, totalItems);

    return `Showing ${firstItem}-${lastItem} of ${totalItems} ${totalItems === 1 ? 'order' : 'orders'}`;
};

export const OrdersTable = ({ isFetching, onPageChange, onPageSizeChange, orders, pagination }: OrdersTableProps) => {
    const totalPages = Math.max(pagination.totalPages, 1);
    const canGoPrevious = pagination.page > 1;
    const canGoNext = pagination.page < totalPages;

    return (
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
                                    <TableCell>
                                        <Link className={styles.orderLink} to={`/orders/${order.id}`}>
                                            {order.tailNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{order.airportIcaoCode}</TableCell>
                                    <TableCell>{formatFuelVolume(order)}</TableCell>
                                    <TableCell>{formatDeliveryWindow(order)}</TableCell>
                                    <TableCell>
                                        <StatusChip
                                            label={getFuelOrderStatusLabel(order.status)}
                                            variant={getStatusChipVariant(order.status)}
                                        />
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
                <span>{getRangeLabel(pagination)}</span>
                <div className={styles.paginationControls}>
                    <label className={styles.pageSizeControl}>
                        <span>Rows per page</span>
                        <Select
                            disabled={isFetching}
                            onValueChange={(value) => onPageSizeChange(Number(value))}
                            options={pageSizeOptions}
                            value={String(pagination.pageSize)}
                        />
                    </label>
                    <span className={styles.pageLabel}>
                        Page {pagination.page} of {totalPages}
                    </span>
                    <div className={styles.pageButtons}>
                        <Button
                            disabled={isFetching || !canGoPrevious}
                            onClick={() => onPageChange(pagination.page - 1)}
                            size="sm"
                            type="button"
                            variant="secondary"
                        >
                            Previous
                        </Button>
                        <Button
                            disabled={isFetching || !canGoNext}
                            onClick={() => onPageChange(pagination.page + 1)}
                            size="sm"
                            type="button"
                            variant="secondary"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
