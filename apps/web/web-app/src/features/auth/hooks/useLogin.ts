import { useMutation } from '@tanstack/react-query';

import { authService } from '../services/authService';
import { useAuthStore } from '../store/auth.store';
import type { LoginRequest } from '../types/auth.types';

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (request: LoginRequest) => authService.login(request),
    onSuccess: (session) => {
      setSession(session);
    },
  });
};
