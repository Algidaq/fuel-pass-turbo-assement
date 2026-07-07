import { useQuery } from '@tanstack/react-query';

import { fuelOrdersService } from '../services/fuelOrdersService';
import type { FuelOrderFilters } from '../types/fuelOrder.types';

export const fuelOrderQueryKeys = {
  all: ['fuel-orders'] as const,
  list: (filters: FuelOrderFilters = {}) => [...fuelOrderQueryKeys.all, 'list', filters] as const,
};

export const useFuelOrders = (filters: FuelOrderFilters = {}) =>
  useQuery({
    queryFn: () => fuelOrdersService.getFuelOrders(filters),
    queryKey: fuelOrderQueryKeys.list(filters),
  });
