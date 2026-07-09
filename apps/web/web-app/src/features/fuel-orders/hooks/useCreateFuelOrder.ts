import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fuelOrdersService } from '../services/fuelOrdersService';

export const useCreateFuelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fuelOrdersService.createFuelOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fuel-orders'] });
    },
  });
};
