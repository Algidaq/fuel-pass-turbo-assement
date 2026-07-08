import { Alert, Button, Card, CardBody, StatusChip } from '@fuel-pass/ui';
import { useState } from 'react';
import {
    type FuelOrder,
    type FuelOrderStatus,
    getFuelOrderStatusLabel,
    getNextFuelOrderStatus,
    getStatusActionLabel,
    getStatusChipVariant,
    useUpdateFuelOrderStatus,
} from '../../../features/fuel-orders';
import { getApiErrorMessage } from '../../../services/apiErrorMessages';
import styles from '../OrderDetailsPage.module.css';

const getUpdateErrorMessage = (error: unknown): string => {
    return getApiErrorMessage(error, 'Unable to update this order status. Please try again.');
};

const getNextActionDescription = (status: FuelOrderStatus): string => {
    if (status === 'PENDING') {
        return 'Confirm this order once the fueling schedule has been reviewed.';
    }

    if (status === 'CONFIRMED') {
        return 'Mark this order as completed once the fueling operation has concluded.';
    }

    return 'This order has completed the operational workflow.';
};

export const CurrentStatusCard = ({ order }: { order: FuelOrder }) => {
    const updateFuelOrderStatus = useUpdateFuelOrderStatus();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const nextStatus = getNextFuelOrderStatus(order.status);
    const actionLabel = getStatusActionLabel(order.status);

    const handleStatusUpdate = async () => {
        if (!nextStatus) {
            return;
        }

        setErrorMessage(null);

        try {
            await updateFuelOrderStatus.mutateAsync({ id: order.id, status: nextStatus });
        } catch (error: unknown) {
            setErrorMessage(getUpdateErrorMessage(error));
        }
    };

    return (
        <Card className={styles.card}>
            <CardBody className={styles.statusCardBody}>
                <div className={styles.statusHeader}>
                    <h2>Current status</h2>
                    <StatusChip label={getFuelOrderStatusLabel(order.status)} variant={getStatusChipVariant(order.status)} />
                </div>
                <p>{getNextActionDescription(order.status)}</p>
                <div className={styles.nextAction}>
                    <h3>Next action</h3>
                    {nextStatus && actionLabel ? (
                        <>
                            <p>
                                Allowed transition: {getFuelOrderStatusLabel(order.status)} to {getFuelOrderStatusLabel(nextStatus)}.
                            </p>
                            <Button disabled={updateFuelOrderStatus.isPending} onClick={handleStatusUpdate} type="button">
                                {updateFuelOrderStatus.isPending ? 'Updating...' : actionLabel}
                            </Button>
                        </>
                    ) : (
                        <p>No further transitions are available.</p>
                    )}
                </div>
                {errorMessage ? (
                    <Alert className={styles.updateError} role="alert" variant="danger">
                        {errorMessage}
                    </Alert>
                ) : null}
            </CardBody>
        </Card>
    );
};
