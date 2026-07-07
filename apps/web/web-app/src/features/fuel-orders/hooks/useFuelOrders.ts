import { useQuery } from '@tanstack/react-query';

import { useAuthHydration } from '../../auth/hooks/useAuthHydration';
import { useAuthStore } from '../../auth/store/auth.store';
import { fuelOrdersService } from '../services/fuelOrdersService';
import type { FuelOrderFilters } from '../types/fuelOrder.types';

export const fuelOrderQueryKeys = {
  all: ['fuel-orders'] as const,
  list: (filters: FuelOrderFilters = {}) => [...fuelOrderQueryKeys.all, 'list', filters] as const,
};

export const useFuelOrders = (filters: FuelOrderFilters = {}) => {
  const isHydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryFn: () => fuelOrdersService.getFuelOrders(filters),
    queryKey: fuelOrderQueryKeys.list(filters),
    enabled: isHydrated && isAuthenticated,
  });
};
