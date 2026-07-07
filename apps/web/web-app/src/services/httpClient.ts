import { env } from '../config/env';
import { authSession } from '../features/auth/services/authSession';
import { useAuthStore } from '../features/auth/store/auth.store';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuthRefresh?: boolean;
};

type BackendError = {
  code?: string;
  message?: string;
  details?: unknown;
};

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

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

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === 'object' && payload !== null && 'errors' in payload) {
    const errors = (payload as { errors?: BackendError[] }).errors;
    const firstError = Array.isArray(errors) ? errors[0] : undefined;

    return firstError?.message ?? firstError?.code ?? fallback;
  }

  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find((item): item is string => typeof item === 'string' && item.trim().length > 0);

      return firstMessage ?? fallback;
    }
  }

  return fallback;
};

export const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' && error !== null && 'status' in error && 'message' in error;

const createApiError = (response: Response, payload: unknown): ApiError => ({
  status: response.status,
  message: getErrorMessage(payload, 'Request failed. Please try again.'),
  details: payload,
});

const shouldAttemptRefresh = (path: string, options: RequestOptions, response: Response): boolean => {
  if (options.skipAuthRefresh || response.status !== 401) {
    return false;
  }

  const normalizedPath = path.replace(/^https?:\/\/[^/]+/i, '');

  return !['/v1/auth/login', '/v1/auth/logout', '/v1/auth/refresh'].some((authPath) => normalizedPath.endsWith(authPath));
};

const sendRequest = async (path: string, options: RequestOptions): Promise<Response> => {
  const { body, ...requestOptions } = options;
  const accessToken = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);
  const hasJsonBody = body !== undefined;
  delete requestOptions.skipAuthRefresh;

  if (hasJsonBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(buildUrl(path), {
    ...requestOptions,
    headers,
    body: hasJsonBody ? JSON.stringify(body) : undefined,
  });
};

export const httpClient = async <TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> => {
  let response: Response;

  try {
    response = await sendRequest(path, options);
  } catch (error) {
    throw {
      status: 0,
      message: 'Unable to reach the server. Check your connection and try again.',
      details: error instanceof Error ? error.message : error,
    } satisfies ApiError;
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const originalError = createApiError(response, payload);

    if (shouldAttemptRefresh(path, options, response)) {
      const refreshResult = await authSession.refreshAccessToken();

      if (refreshResult) {
        try {
          const retryResponse = await sendRequest(path, { ...options, skipAuthRefresh: true });
          const retryPayload = await parseJsonSafely(retryResponse);

          if (!retryResponse.ok) {
            throw createApiError(retryResponse, retryPayload);
          }

          return retryPayload as TResponse;
        } catch (error) {
          if (isApiError(error)) {
            throw error;
          }

          throw {
            status: 0,
            message: 'Unable to reach the server. Check your connection and try again.',
            details: error instanceof Error ? error.message : error,
          } satisfies ApiError;
        }
      }
    }

    throw originalError;
  }

  return payload as TResponse;
};
