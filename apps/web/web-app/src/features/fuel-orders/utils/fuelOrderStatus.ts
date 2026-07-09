import type { StatusChipVariant } from '@fuel-pass/ui';

import type { FuelOrderStatus } from '../types/fuelOrder.types';

const nextStatusByCurrentStatus: Partial<Record<FuelOrderStatus, FuelOrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'COMPLETED',
};

const statusLabels: Record<FuelOrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
};

export const getFuelOrderStatusLabel = (status: FuelOrderStatus): string => statusLabels[status];

export const getNextFuelOrderStatus = (status: FuelOrderStatus): FuelOrderStatus | null => nextStatusByCurrentStatus[status] ?? null;

export const getStatusActionLabel = (status: FuelOrderStatus): string | null => {
  if (status === 'PENDING') {
    return 'Confirm';
  }

  if (status === 'CONFIRMED') {
    return 'Complete';
  }

  return null;
};

export const getStatusChipVariant = (status: FuelOrderStatus): StatusChipVariant => {
  if (status === 'CONFIRMED') {
    return 'confirmed';
  }

  if (status === 'COMPLETED') {
    return 'completed';
  }

  return 'pending';
};

export const canUpdateFuelOrderStatus = (status: FuelOrderStatus): boolean => getNextFuelOrderStatus(status) !== null;
