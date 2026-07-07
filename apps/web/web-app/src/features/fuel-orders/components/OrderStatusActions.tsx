import { Alert, Button } from '@fuel-pass/ui';
import { useState } from 'react';

import { getApiErrorMessage } from '../../../services/apiErrorMessages';
import { useUpdateFuelOrderStatus } from '../hooks/useUpdateFuelOrderStatus';
import type { FuelOrder } from '../types/fuelOrder.types';
import { getNextFuelOrderStatus, getStatusActionLabel } from '../utils/fuelOrderStatus';
import styles from './OrderStatusActions.module.css';

type OrderStatusActionsProps = {
  order: FuelOrder;
};

const getUpdateErrorMessage = (error: unknown): string => {
  return getApiErrorMessage(error, 'Unable to update this order status. Please try again.');
};

export const OrderStatusActions = ({ order }: OrderStatusActionsProps) => {
  const updateFuelOrderStatus = useUpdateFuelOrderStatus();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextStatus = getNextFuelOrderStatus(order.status);
  const actionLabel = getStatusActionLabel(order.status);

  if (!nextStatus || !actionLabel) {
    return <span className={styles.completeText}>Completed</span>;
  }

  const handleUpdateStatus = async () => {
    setErrorMessage(null);

    try {
      await updateFuelOrderStatus.mutateAsync({ id: order.id, status: nextStatus });
    } catch (error: unknown) {
      setErrorMessage(getUpdateErrorMessage(error));
    }
  };

  return (
    <div className={styles.actions}>
      <Button disabled={updateFuelOrderStatus.isPending} onClick={handleUpdateStatus} size="sm" type="button">
        {updateFuelOrderStatus.isPending ? 'Updating...' : actionLabel}
      </Button>
      {errorMessage ? (
        <Alert className={styles.error} role="alert" variant="danger">
          {errorMessage}
        </Alert>
      ) : null}
    </div>
  );
};
