import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthUser, LoginResponse } from '../types/auth.types';

type PersistedAuthState = Pick<AuthState, 'accessToken' | 'refreshToken' | 'user'>;

type AuthState = {
  accessToken: string | null;
  refreshToken?: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSession: (session: LoginResponse) => void;
  clearSession: () => void;
  setHydrated: (isHydrated: boolean) => void;
};

const getIsAuthenticated = (state: PersistedAuthState): boolean => Boolean(state.accessToken && state.user);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: undefined,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          isAuthenticated: true,
        }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: undefined,
          user: null,
          isAuthenticated: false,
        }),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'fuel-pass-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedAuthState> | undefined;
        const merged = {
          ...currentState,
          ...persisted,
        };

        return {
          ...merged,
          isAuthenticated: getIsAuthenticated(merged),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
