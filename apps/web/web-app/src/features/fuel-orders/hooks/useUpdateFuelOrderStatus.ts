import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fuelOrdersService } from '../services/fuelOrdersService';
import type { FuelOrderStatus } from '../types/fuelOrder.types';
import { fuelOrderQueryKeys } from './useFuelOrders';

type UpdateFuelOrderStatusVariables = {
  id: string;
  status: FuelOrderStatus;
};

export const useUpdateFuelOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateFuelOrderStatusVariables) => fuelOrdersService.updateFuelOrderStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fuelOrderQueryKeys.all });
    },
  });
};
