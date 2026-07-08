import { useQuery } from '@tanstack/react-query';

import { useAuthHydration } from '../../auth/hooks/useAuthHydration';
import { useAuthStore } from '../../auth/store/auth.store';
import { fuelOrdersService } from '../services/fuelOrdersService';
import { fuelOrderQueryKeys } from './useFuelOrders';

export const useFuelOrder = (id: string | undefined) => {
    const isHydrated = useAuthHydration();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return useQuery({
        queryFn: () => fuelOrdersService.getFuelOrder(id ?? '', { includeStatusHistory: true, includeUser: true }),
        queryKey: fuelOrderQueryKeys.detail(id ?? ''),
        enabled: isHydrated && isAuthenticated && Boolean(id),
    });
};
