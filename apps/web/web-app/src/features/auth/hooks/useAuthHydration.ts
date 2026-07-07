import { useAuthStore } from '../store/auth.store';

export const useAuthHydration = () => useAuthStore((state) => state.isHydrated);
