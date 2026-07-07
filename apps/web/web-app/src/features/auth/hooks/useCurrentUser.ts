import { useQuery } from '@tanstack/react-query';

import { authService } from '../services/authService';
import { useAuthHydration } from './useAuthHydration';
import { useAuthStore } from '../store/auth.store';

export const useCurrentUser = () => {
  const isHydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: authService.getCurrentUser,
    enabled: isHydrated && isAuthenticated,
  });
};
