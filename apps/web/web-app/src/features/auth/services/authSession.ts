import { z } from 'zod';

import { env } from '../../../config/env';
import { useAuthStore } from '../store/auth.store';

export type SessionExpiredReason = 'missing_refresh_token' | 'refresh_token_rejected';

type SessionExpiredEvent = {
  reason: SessionExpiredReason;
};

type SessionExpiredListener = (event: SessionExpiredEvent) => void;

const camelRefreshResponseSchema = z.object({
  accessToken: z.string().trim().min(1),
  refreshToken: z.string().trim().min(1),
  expiresIn: z.number().optional(),
  tokenType: z.literal('Bearer').optional(),
});

const snakeRefreshResponseSchema = z
  .object({
    access_token: z.string().trim().min(1),
    refresh_token: z.string().trim().min(1),
    expires_in: z.number().optional(),
    token_type: z.literal('Bearer').optional(),
  })
  .transform((response) => ({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresIn: response.expires_in,
    tokenType: response.token_type,
  }));

const refreshResponseSchema = z.union([camelRefreshResponseSchema, snakeRefreshResponseSchema]);

type RefreshResponse = z.infer<typeof refreshResponseSchema>;

const sessionExpiredListeners = new Set<SessionExpiredListener>();
let refreshPromise: Promise<RefreshResponse | null> | null = null;

const buildUrl = (path: string): string => {
  const baseUrl = env.apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (text.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const isRefreshTokenRejected = (response: Response): boolean => [400, 401, 403].includes(response.status);

const expireSession = (reason: SessionExpiredReason): void => {
  useAuthStore.getState().clearSession();
  sessionExpiredListeners.forEach((listener) => listener({ reason }));
};

const executeRefresh = async (): Promise<RefreshResponse | null> => {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    expireSession('missing_refresh_token');
    return null;
  }

  let response: Response;

  try {
    response = await fetch(buildUrl('/v1/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return null;
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    if (isRefreshTokenRejected(response)) {
      expireSession('refresh_token_rejected');
    }

    return null;
  }

  const result = refreshResponseSchema.safeParse(payload);

  if (!result.success) {
    return null;
  }

  useAuthStore.getState().updateTokens({
    accessToken: result.data.accessToken,
    refreshToken: result.data.refreshToken,
  });

  return result.data;
};

export const authSession = {
  refreshAccessToken(): Promise<RefreshResponse | null> {
    refreshPromise ??= executeRefresh().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  },

  subscribeToSessionExpired(listener: SessionExpiredListener): () => void {
    sessionExpiredListeners.add(listener);

    return () => {
      sessionExpiredListeners.delete(listener);
    };
  },
};
